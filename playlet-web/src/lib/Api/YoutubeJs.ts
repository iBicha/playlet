import { Innertube, Platform, UniversalCache, type Types } from 'youtubei.js/web';
import { getHost } from "lib/Api/Host";
import { BG, buildURL, GOOG_API_KEY, type WebPoSignalOutput } from "bgutils-js";
import { type BgConfig } from "bgutils-js";
import type { VideoInfo } from 'node_modules/youtubei.js/dist/src/parser/youtube';
import type { StoryboardData } from 'node_modules/youtubei.js/dist/src/parser/classes/PlayerStoryboardSpec';
import type { PlayerLiveStoryboardSpec, PlayerStoryboardSpec } from 'node_modules/youtubei.js/dist/src/parser/nodes';
import type { Format } from 'node_modules/youtubei.js/dist/src/parser/misc';

export class YoutubeJs {
    static host = () => `http://${getHost()}`

    static innerTube: Innertube;
    static innerTubePromise: Promise<void>;

    static webPoMinter: BG.WebPoMinter;
    static webPoMinterPromise: Promise<void>;

    static visitorData?: string = undefined;

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

        let body = init?.body

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
        })

        const responseData = await response.json();

        return new Response(responseData.body, {
            status: responseData.status,
            statusText: `${responseData.status}`,
            headers: responseData.headers,
        });
    }

    static async initVisitorData() {
        if (YoutubeJs.visitorData) {
            return Promise.resolve();
        }

        const sessionData = await YoutubeJs.getSessionData();
        if (sessionData.visitorData) {
            YoutubeJs.visitorData = sessionData.visitorData;
            return;
        }

        YoutubeJs.visitorData = await YoutubeJs.generateVisitorData();

        await YoutubeJs.setSessionData({
            visitorData: YoutubeJs.visitorData,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    static async getSessionData() {
        const response = await fetch(`http://${getHost()}/api/innertube/session`)
        return await response.json();
    }

    static async setSessionData(sessionData: any) {
        await fetch(`http://${getHost()}/api/innertube/session`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sessionData)
        });
    }

    static async getInnertube() {
        await YoutubeJs.initInnertube();
        return YoutubeJs.innerTube;
    }

    static async initInnertube() {
        if (YoutubeJs.innerTube) {
            return Promise.resolve();
        }

        if (YoutubeJs.innerTubePromise) {
            return YoutubeJs.innerTubePromise;
        }

        YoutubeJs.innerTubePromise = new Promise(async (resolve, reject) => {
            try {
                this.initJsEvaluator();
                await YoutubeJs.initVisitorData()
                YoutubeJs.innerTube = await Innertube.create({
                    fetch: YoutubeJs.fetch,
                    cache: new UniversalCache(true),
                    visitor_data: YoutubeJs.visitorData,
                });
                YoutubeJs.innerTubePromise = null;
                resolve();
            } catch (error) {
                console.error(error);
                YoutubeJs.innerTube = null;
                YoutubeJs.innerTubePromise = null;
                reject(error);
            }
        })

        return YoutubeJs.innerTubePromise;
    }

    static initJsEvaluator() {
        Platform.shim.eval = async (data: Types.BuildScriptResult, env: Record<string, Types.VMPrimative>) => {
            const properties = [];

            if (env.n) {
                properties.push(`n: exportedVars.nFunction("${env.n}")`)
            }

            if (env.sig) {
                properties.push(`sig: exportedVars.sigFunction("${env.sig}")`)
            }

            const code = `${data.output}\nreturn { ${properties.join(', ')} }`;

            return new Function(code)();
        }
    }

    static async generateVisitorData() {
        const innertube = await Innertube.create({ retrieve_player: false });
        const visitorData = innertube.session.context.client.visitorData;
        if (!visitorData) {
            throw new Error('Could not get visitor data');
        }
        return visitorData;
    }

    static async initWebPoMinter() {
        if (YoutubeJs.webPoMinter) {
            return Promise.resolve();
        }

        if (YoutubeJs.webPoMinterPromise) {
            return YoutubeJs.webPoMinterPromise;
        }

        YoutubeJs.webPoMinterPromise = new Promise(async (resolve, reject) => {
            try {
                const requestKey = 'O43z0dpjhgX20SCx4KAo';

                const bgConfig: BgConfig = {
                    fetch: (input: string | URL | globalThis.Request, init?: RequestInit) => YoutubeJs.fetch(input, init),
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

                YoutubeJs.webPoMinter = await BG.WebPoMinter.create({ integrityToken: response[0] }, webPoSignalOutput);
                YoutubeJs.webPoMinterPromise = null;
                resolve();
            } catch (error) {
                console.error(error);
                YoutubeJs.webPoMinter = null;
                YoutubeJs.webPoMinterPromise = null;
                reject(error);
                return;
            }
        });

        return YoutubeJs.webPoMinterPromise;
    }

    static async generatePoToken(videoId: string) {
        await YoutubeJs.initWebPoMinter();

        if (!YoutubeJs.webPoMinter) {
            throw new Error('WebPoMinter is not initialized');
        }

        return await YoutubeJs.webPoMinter.mintAsWebsafeString(videoId);
    }

    static async getVideoInfo(videoId: string) {
        await YoutubeJs.initInnertube();

        const info = await YoutubeJs.innerTube.getBasicInfo(videoId, {
            client: 'TV',
            po_token: await YoutubeJs.generatePoToken(videoId),
        });

        // We can't generate a proper dash from live videos.
        // By returning null, we're telling Playlet to fetch video info itself.
        if (info.basic_info.is_live) {
            return null;
        }

        YoutubeJs.innerTube.session.player.po_token = YoutubeJs.innerTube.session.po_token;

        // Populate a video object that is similar to Invidious format.
        // Mostly populate only fields we care about, enough to make it work.
        return {
            type: "video",
            title: info.basic_info.title,
            videoId: info.basic_info.id,
            videoThumbnails: [],
            storyboards: YoutubeJs.getStoryboards(info),
            description: "",
            published: 0,
            publishedText: "",
            keywords: [],
            viewCount: 0,
            likeCount: 0,
            dislikeCount: 0,
            paid: false,
            premium: false,
            isFamilyFriendly: true,
            allowedRegions: [],
            genre: "",
            genreUrl: null,
            author: info.basic_info.author,
            authorId: info.basic_info.channel_id,
            authorUrl: "",
            authorVerified: false,
            authorThumbnails: [],
            subCountText: "",
            lengthSeconds: info.basic_info.duration,
            allowRatings: true,
            rating: 0,
            isListed: true,
            liveNow: info.basic_info.is_live,
            isPostLiveDvr: info.basic_info.is_post_live_dvr,
            isUpcoming: info.basic_info.is_upcoming,
            dashUrl: info.streaming_data.dash_manifest_url || "",
            hlsUrl: info.streaming_data.hls_manifest_url,
            adaptiveFormats: await YoutubeJs.transformFormats(info.streaming_data?.adaptive_formats),
            formatStreams: await YoutubeJs.transformFormats(info.streaming_data?.formats),
            captions: YoutubeJs.getCaptions(info),
        }
    }

    static async transformFormats(formats: Format[]) {
        if (!formats) {
            return [];
        }

        return Promise.all(formats.map(format =>
            YoutubeJs.transformStreamFormat(format)
        ));
    }

    static async transformStreamFormat(format: Format): Promise<any> {
        const result: any = {
            init: format.init_range ? `${format.init_range.start}-${format.init_range.end}` : "",
            index: format.index_range ? `${format.index_range.start}-${format.index_range.end}` : "",
            bitrate: `${format.bitrate}`,
            url: await format.decipher(YoutubeJs.innerTube.session.player),
            itag: `${format.itag}`,
            type: format.mime_type,
            clen: `${format.approx_duration_ms}`,
            lmt: `${format.last_modified}`,
        };
        if (format.audio_quality) {
            result.audioQuality = format.audio_quality;
        }
        if (format.audio_sample_rate) {
            result.audioSampleRate = format.audio_sample_rate;
        }
        if (format.audio_channels) {
            result.audioChannels = format.audio_channels;
        }

        if (format.quality_label) {
            result.qualityLabel = format.quality_label;
        }
        if (format.fps) {
            result.fps = format.fps;
        }

        if (format.width) {
            result.width = format.width;
        }
        if (format.height) {
            result.height = format.height;
        }
        if (format.height && format.width) {
            result.size = `${format.width}x${format.height}`;
            result.resolution = `${format.height}p`;
        }

        return result;
    }

    static getStoryboards(videoInfo: VideoInfo) {
        if (!videoInfo.storyboards) {
            return [];
        }

        if (videoInfo.storyboards.type === 'PlayerLiveStoryboardSpec') {
            const board = (videoInfo.storyboards as PlayerLiveStoryboardSpec).board
            return [{
                templateUrl: board.template_url,
                width: board.thumbnail_width,
                height: board.thumbnail_height,
                count: -1,
                interval: 5000,
                storyboardWidth: board.columns,
                storyboardHeight: board.rows,
            }];
        }

        const storyboards = (videoInfo.storyboards as PlayerStoryboardSpec).boards;
        return storyboards.map((board: StoryboardData) => {
            return {
                templateUrl: board.template_url,
                width: board.thumbnail_width,
                height: board.thumbnail_height,
                count: board.thumbnail_count,
                interval: board.interval,
                storyboardWidth: board.columns,
                storyboardHeight: board.rows,
                storyboardCount: board.storyboard_count
            };
        });
    }

    static getCaptions(videoInfo: VideoInfo) {
        if (!videoInfo.captions?.caption_tracks) {
            return [];
        }

        return videoInfo.captions.caption_tracks.map(track => {
            const baseUrl = track.base_url;
            if (!baseUrl) {
                return null;
            }

            const queryComponents = new URLSearchParams(baseUrl.split('?')[1]);
            queryComponents.set('fmt', 'vtt');
            const modifiedBaseUrl = `${baseUrl.split('?')[0]}?${queryComponents.toString()}`;

            return {
                label: track.name.toString(),
                language_code: track.language_code || '',
                url: modifiedBaseUrl
            };
        }).filter(caption => !!caption);
    }
}