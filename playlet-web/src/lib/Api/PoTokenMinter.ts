import { getHost } from "lib/Api/Host";
import { PlayletApi } from "lib/Api/PlayletApi";
import { BG, buildURL, GOOG_API_KEY, type WebPoSignalOutput, type BgConfig } from "bgutils-js";

// Fallback lifetime when GenerateIT reports no TTL.
const DEFAULT_POTOKEN_TTL_SECONDS = 60 * 60 * 6;

// Re-mint when the device's token is older than this; the web app owns the refresh cadence.
const REFRESH_AGE_SECONDS = 60 * 60;

export type EnsurePoTokenResult =
    | { status: "minted" }
    | { status: "current" }
    | { status: "no-session" }
    | { status: "failed"; error: string };

interface DevicePoToken {
    identity?: string;
    poToken?: string;
    mintedAt?: number;
    expiresAt?: number;
}

// Mints a GVS poToken in the browser (BotGuard) and hands it to the Roku.
export class PoTokenMinter {
    static webPoMinter: BG.WebPoMinter;
    static webPoMinterPromise: Promise<void>;
    static integrityTokenExpiresAtMs = 0;

    // Proxied through the Roku to dodge browser CORS.
    static async fetch(input: RequestInfo | URL, init?: RequestInit) {
        const method = init?.method
            ? init.method
            : input instanceof Request
                ? input.method
                : 'GET';

        const url = typeof input === 'string'
            ? new URL(input)
            : input instanceof URL
                ? input
                : new URL(input.url);

        const headers = init?.headers
            ? new Headers(init.headers)
            : input instanceof Request
                ? input.headers
                : new Headers();

        const headersObject = {};
        headers.forEach((value, key) => {
            headersObject[key] = value;
        });

        const body = init?.body;

        const args = {
            Method: method,
            Url: url,
            Headers: headersObject,
            Body: body,
            CacheSeconds: -1,
        };

        const response = await fetch(`http://${getHost()}/api/innertube/proxy`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify(args)
        });

        const responseData = await response.json();

        return new Response(responseData.body, {
            status: responseData.status,
            statusText: `${responseData.status}`,
            headers: responseData.headers,
        });
    }

    static async initWebPoMinter() {
        // Re-attest once the integrity token nears expiry.
        if (PoTokenMinter.webPoMinter && Date.now() < PoTokenMinter.integrityTokenExpiresAtMs - 60_000) {
            return Promise.resolve();
        }

        if (PoTokenMinter.webPoMinterPromise) {
            return PoTokenMinter.webPoMinterPromise;
        }

        PoTokenMinter.webPoMinterPromise = new Promise(async (resolve, reject) => {
            try {
                const requestKey = 'O43z0dpjhgX20SCx4KAo';

                const bgConfig: BgConfig = {
                    fetch: (input: string | URL | globalThis.Request, init?: RequestInit) => PoTokenMinter.fetch(input, init),
                    globalObj: globalThis,
                    requestKey,
                    identifier: ''
                };

                const bgChallenge = await BG.Challenge.create(bgConfig);
                if (!bgChallenge) {
                    throw new Error('Could not get challenge');
                }

                const interpreterJavascript = bgChallenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;
                if (interpreterJavascript) {
                    new Function(interpreterJavascript)();
                } else {
                    throw new Error('Could not load VM');
                }

                const botguard = await BG.BotGuardClient.create({
                    globalName: bgChallenge.globalName,
                    globalObj: globalThis,
                    program: bgChallenge.program
                });

                const webPoSignalOutput: WebPoSignalOutput = [];
                const botguardResponse = await botguard.snapshot({ webPoSignalOutput });

                const integrityTokenResponse = await bgConfig.fetch(buildURL('GenerateIT', true), {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json+protobuf',
                        'x-goog-api-key': GOOG_API_KEY,
                        'x-user-agent': 'grpc-web-javascript/0.1'
                    },
                    body: JSON.stringify([requestKey, botguardResponse])
                });

                const response = await integrityTokenResponse.json() as unknown[];

                if (typeof response[0] !== 'string')
                    throw new Error('Could not get integrity token');

                // GenerateIT returns the integrity token's estimated TTL (seconds) as body[1].
                const ttlSeconds = typeof response[1] === 'number' && response[1] > 0
                    ? Math.floor(response[1])
                    : DEFAULT_POTOKEN_TTL_SECONDS;
                PoTokenMinter.integrityTokenExpiresAtMs = Date.now() + ttlSeconds * 1000;

                PoTokenMinter.webPoMinter = await BG.WebPoMinter.create({ integrityToken: response[0] }, webPoSignalOutput);
                PoTokenMinter.webPoMinterPromise = null;
                resolve();
            } catch (error) {
                console.error(error);
                PoTokenMinter.webPoMinter = null;
                PoTokenMinter.integrityTokenExpiresAtMs = 0;
                PoTokenMinter.webPoMinterPromise = null;
                reject(error);
                return;
            }
        });

        return PoTokenMinter.webPoMinterPromise;
    }

    static async mintPoToken(identity: string) {
        await PoTokenMinter.initWebPoMinter();

        if (!PoTokenMinter.webPoMinter) {
            throw new Error('WebPoMinter is not initialized');
        }

        return await PoTokenMinter.webPoMinter.mintAsWebsafeString(identity);
    }

    // Re-mint when the device has no token, it expired, or it is older than the refresh window.
    static shouldRefresh(device: DevicePoToken): boolean {
        if (!device.poToken || typeof device.mintedAt !== "number" || typeof device.expiresAt !== "number") {
            return true;
        }
        const now = Math.floor(Date.now() / 1000);
        if (now >= device.expiresAt) {
            return true;
        }
        return now - device.mintedAt >= REFRESH_AGE_SECONDS;
    }

    // Mints + uploads a poToken when the device's token needs refreshing.
    static async ensureDevicePoToken(): Promise<EnsurePoTokenResult> {
        let device: DevicePoToken;
        try {
            device = await PlayletApi.getDevicePoToken();
        } catch (error) {
            return { status: "failed", error: String(error) };
        }

        // Identity = what the device sends to the decipher server (empty = nothing to mint for).
        const identity = device?.identity;
        if (!identity) {
            return { status: "no-session" };
        }
        if (!PoTokenMinter.shouldRefresh(device)) {
            return { status: "current" };
        }

        try {
            const poToken = await PoTokenMinter.mintPoToken(identity);
            // The token is valid until the integrity token expires; fall back to a default TTL.
            const mintedAt = Math.floor(Date.now() / 1000);
            const expiresAt = PoTokenMinter.integrityTokenExpiresAtMs > 0
                ? Math.floor(PoTokenMinter.integrityTokenExpiresAtMs / 1000)
                : mintedAt + DEFAULT_POTOKEN_TTL_SECONDS;
            await PlayletApi.sendPoToken(identity, poToken, mintedAt, expiresAt);
            return { status: "minted" };
        } catch (error) {
            return { status: "failed", error: String(error) };
        }
    }
}
