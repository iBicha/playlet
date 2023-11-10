import { Innertube } from 'youtubei.js/web';
import { getHost } from "lib/Api/Host";

export class YoutubeJs {
    static innerTube: Innertube;
    static initPromise: Promise<void>;

    static async init() {
        if (YoutubeJs.innerTube) {
            return;
        }

        if (YoutubeJs.initPromise) {
            return YoutubeJs.initPromise;
        }

        YoutubeJs.initPromise = new Promise(async (resolve, reject) => {
            try {
                YoutubeJs.innerTube = await Innertube.create({
                    // @ts-ignore
                    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {

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
                        };

                        const response = await fetch(`http://${getHost()}/api/proxy`, {
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            method: "POST",
                            body: JSON.stringify(args)
                        })

                        const responseData = await response.json();

                        return new Response(responseData.body, {
                            status: responseData.status,
                            statusText: `${responseData.status}`,
                            headers: responseData.headers,
                        });
                    }
                });
                resolve();
            } catch (error) {
                console.error(error);
                YoutubeJs.innerTube = null;
                reject(error);
            }
            YoutubeJs.initPromise = null;
        });
        await YoutubeJs.initPromise;
    }

    static async resolveUrl(url: string) {
        url = await YoutubeJs.getRedirect(url);
        await this.init();
        const navEndpoint = await YoutubeJs.innerTube.resolveURL(url);
        const payload = navEndpoint.payload;
        const pageType = navEndpoint.metadata.page_type;

        return {
            pageType,
            videoId: payload.videoId,
            playlistId: payload.playlistId,
            timestamp: payload.startTimeSeconds,
            ucid: payload.browseId,
        }
    }

    static async getRedirect(url: string) {
        const response = await fetch(`http://${getHost()}/api/proxy`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
                Method: 'HEAD',
                Url: url,
            })
        })

        const json = await response.json();
        const location = json?.headers?.location;
        return location ? location : url;
    }
}
