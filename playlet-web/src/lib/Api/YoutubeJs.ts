import { Innertube, UniversalCache } from 'youtubei.js/web';
import { getHost } from "lib/Api/Host";
import { BG, buildURL, GOOG_API_KEY, type WebPoSignalOutput } from "bgutils-js";
import { type BgConfig } from "bgutils-js";
import type { VideoInfo } from 'node_modules/youtubei.js/dist/src/parser/youtube';
import type { StoryboardData } from 'node_modules/youtubei.js/dist/src/parser/classes/PlayerStoryboardSpec';
import type { PlayerLiveStoryboardSpec, PlayerStoryboardSpec } from 'node_modules/youtubei.js/dist/src/parser/nodes';

// https://github.com/iv-org/invidious/blob/a021b93063f3956fc9bb3cce0fb56ea252422738/src/invidious/videos/formats.cr#L7
const FORMATS = {
    "5": { ext: "flv", width: 400, height: 240, acodec: "mp3", abr: 64, vcodec: "h263" },
    "6": { ext: "flv", width: 450, height: 270, acodec: "mp3", abr: 64, vcodec: "h263" },
    "13": { ext: "3gp", acodec: "aac", vcodec: "mp4v" },
    "17": { ext: "3gp", width: 176, height: 144, acodec: "aac", abr: 24, vcodec: "mp4v" },
    "18": { ext: "mp4", width: 640, height: 360, acodec: "aac", abr: 96, vcodec: "h264" },
    "22": { ext: "mp4", width: 1280, height: 720, acodec: "aac", abr: 192, vcodec: "h264" },
    "34": { ext: "flv", width: 640, height: 360, acodec: "aac", abr: 128, vcodec: "h264" },
    "35": { ext: "flv", width: 854, height: 480, acodec: "aac", abr: 128, vcodec: "h264" },
    "36": { ext: "3gp", width: 320, acodec: "aac", vcodec: "mp4v" },
    "37": { ext: "mp4", width: 1920, height: 1080, acodec: "aac", abr: 192, vcodec: "h264" },
    "38": { ext: "mp4", width: 4096, height: 3072, acodec: "aac", abr: 192, vcodec: "h264" },
    "43": { ext: "webm", width: 640, height: 360, acodec: "vorbis", abr: 128, vcodec: "vp8" },
    "44": { ext: "webm", width: 854, height: 480, acodec: "vorbis", abr: 128, vcodec: "vp8" },
    "45": { ext: "webm", width: 1280, height: 720, acodec: "vorbis", abr: 192, vcodec: "vp8" },
    "46": { ext: "webm", width: 1920, height: 1080, acodec: "vorbis", abr: 192, vcodec: "vp8" },
    "59": { ext: "mp4", width: 854, height: 480, acodec: "aac", abr: 128, vcodec: "h264" },
    "78": { ext: "mp4", width: 854, height: 480, acodec: "aac", abr: 128, vcodec: "h264" },
    "82": { ext: "mp4", height: 360, format: "3D", acodec: "aac", abr: 128, vcodec: "h264" },
    "83": { ext: "mp4", height: 480, format: "3D", acodec: "aac", abr: 128, vcodec: "h264" },
    "84": { ext: "mp4", height: 720, format: "3D", acodec: "aac", abr: 192, vcodec: "h264" },
    "85": { ext: "mp4", height: 1080, format: "3D", acodec: "aac", abr: 192, vcodec: "h264" },
    "100": { ext: "webm", height: 360, format: "3D", acodec: "vorbis", abr: 128, vcodec: "vp8" },
    "101": { ext: "webm", height: 480, format: "3D", acodec: "vorbis", abr: 192, vcodec: "vp8" },
    "102": { ext: "webm", height: 720, format: "3D", acodec: "vorbis", abr: 192, vcodec: "vp8" },
    "91": { ext: "mp4", height: 144, format: "HLS", acodec: "aac", abr: 48, vcodec: "h264" },
    "92": { ext: "mp4", height: 240, format: "HLS", acodec: "aac", abr: 48, vcodec: "h264" },
    "93": { ext: "mp4", height: 360, format: "HLS", acodec: "aac", abr: 128, vcodec: "h264" },
    "94": { ext: "mp4", height: 480, format: "HLS", acodec: "aac", abr: 128, vcodec: "h264" },
    "95": { ext: "mp4", height: 720, format: "HLS", acodec: "aac", abr: 256, vcodec: "h264" },
    "96": { ext: "mp4", height: 1080, format: "HLS", acodec: "aac", abr: 256, vcodec: "h264" },
    "132": { ext: "mp4", height: 240, format: "HLS", acodec: "aac", abr: 48, vcodec: "h264" },
    "151": { ext: "mp4", height: 72, format: "HLS", acodec: "aac", abr: 24, vcodec: "h264" },
    "133": { ext: "mp4", height: 240, format: "DASH video", vcodec: "h264" },
    "134": { ext: "mp4", height: 360, format: "DASH video", vcodec: "h264" },
    "135": { ext: "mp4", height: 480, format: "DASH video", vcodec: "h264" },
    "136": { ext: "mp4", height: 720, format: "DASH video", vcodec: "h264" },
    "137": { ext: "mp4", height: 1080, format: "DASH video", vcodec: "h264" },
    "138": { ext: "mp4", format: "DASH video", vcodec: "h264" },
    "160": { ext: "mp4", height: 144, format: "DASH video", vcodec: "h264" },
    "212": { ext: "mp4", height: 480, format: "DASH video", vcodec: "h264" },
    "264": { ext: "mp4", height: 1440, format: "DASH video", vcodec: "h264" },
    "298": { ext: "mp4", height: 720, format: "DASH video", vcodec: "h264", fps: 60 },
    "299": { ext: "mp4", height: 1080, format: "DASH video", vcodec: "h264", fps: 60 },
    "266": { ext: "mp4", height: 2160, format: "DASH video", vcodec: "h264" },
    "139": { ext: "m4a", format: "DASH audio", acodec: "aac", abr: 48, container: "m4a_dash" },
    "140": { ext: "m4a", format: "DASH audio", acodec: "aac", abr: 128, container: "m4a_dash" },
    "141": { ext: "m4a", format: "DASH audio", acodec: "aac", abr: 256, container: "m4a_dash" },
    "256": { ext: "m4a", format: "DASH audio", acodec: "aac", container: "m4a_dash" },
    "258": { ext: "m4a", format: "DASH audio", acodec: "aac", container: "m4a_dash" },
    "325": { ext: "m4a", format: "DASH audio", acodec: "dtse", container: "m4a_dash" },
    "328": { ext: "m4a", format: "DASH audio", acodec: "ec-3", container: "m4a_dash" },
    "167": { ext: "webm", height: 360, width: 640, format: "DASH video", container: "webm", vcodec: "vp8" },
    "168": { ext: "webm", height: 480, width: 854, format: "DASH video", container: "webm", vcodec: "vp8" },
    "169": { ext: "webm", height: 720, width: 1280, format: "DASH video", container: "webm", vcodec: "vp8" },
    "170": { ext: "webm", height: 1080, width: 1920, format: "DASH video", container: "webm", vcodec: "vp8" },
    "218": { ext: "webm", height: 480, width: 854, format: "DASH video", container: "webm", vcodec: "vp8" },
    "219": { ext: "webm", height: 480, width: 854, format: "DASH video", container: "webm", vcodec: "vp8" },
    "278": { ext: "webm", height: 144, format: "DASH video", container: "webm", vcodec: "vp9" },
    "242": { ext: "webm", height: 240, format: "DASH video", vcodec: "vp9" },
    "243": { ext: "webm", height: 360, format: "DASH video", vcodec: "vp9" },
    "244": { ext: "webm", height: 480, format: "DASH video", vcodec: "vp9" },
    "245": { ext: "webm", height: 480, format: "DASH video", vcodec: "vp9" },
    "246": { ext: "webm", height: 480, format: "DASH video", vcodec: "vp9" },
    "247": { ext: "webm", height: 720, format: "DASH video", vcodec: "vp9" },
    "248": { ext: "webm", height: 1080, format: "DASH video", vcodec: "vp9" },
    "271": { ext: "webm", height: 1440, format: "DASH video", vcodec: "vp9" },
    "272": { ext: "webm", height: 2160, format: "DASH video", vcodec: "vp9" },
    "302": { ext: "webm", height: 720, format: "DASH video", vcodec: "vp9", fps: 60 },
    "303": { ext: "webm", height: 1080, format: "DASH video", vcodec: "vp9", fps: 60 },
    "308": { ext: "webm", height: 1440, format: "DASH video", vcodec: "vp9", fps: 60 },
    "313": { ext: "webm", height: 2160, format: "DASH video", vcodec: "vp9" },
    "315": { ext: "webm", height: 2160, format: "DASH video", vcodec: "vp9", fps: 60 },
    "330": { ext: "webm", height: 144, format: "DASH video", vcodec: "vp9", fps: 60 },
    "331": { ext: "webm", height: 240, format: "DASH video", vcodec: "vp9", fps: 60 },
    "332": { ext: "webm", height: 360, format: "DASH video", vcodec: "vp9", fps: 60 },
    "333": { ext: "webm", height: 480, format: "DASH video", vcodec: "vp9", fps: 60 },
    "334": { ext: "webm", height: 720, format: "DASH video", vcodec: "vp9", fps: 60 },
    "335": { ext: "webm", height: 1080, format: "DASH video", vcodec: "vp9", fps: 60 },
    "336": { ext: "webm", height: 1440, format: "DASH video", vcodec: "vp9", fps: 60 },
    "337": { ext: "webm", height: 2160, format: "DASH video", vcodec: "vp9", fps: 60 },
    "171": { ext: "webm", acodec: "vorbis", format: "DASH audio", abr: 128 },
    "172": { ext: "webm", acodec: "vorbis", format: "DASH audio", abr: 256 },
    "249": { ext: "webm", format: "DASH audio", acodec: "opus", abr: 50 },
    "250": { ext: "webm", format: "DASH audio", acodec: "opus", abr: 70 },
    "251": { ext: "webm", format: "DASH audio", acodec: "opus", abr: 160 },
    "394": { ext: "mp4", height: 144, vcodec: "av01.0.05M.08" },
    "395": { ext: "mp4", height: 240, vcodec: "av01.0.05M.08" },
    "396": { ext: "mp4", height: 360, vcodec: "av01.0.05M.08" },
    "397": { ext: "mp4", height: 480, vcodec: "av01.0.05M.08" }
}

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

        // Populate a video object that is similar to Invidious format.
        // Mostly populate only fields we care about, enough to make it work.
        return {
            type: "video",
            ytjs: true,
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
            adaptiveFormats: YoutubeJs.getAdaptiveFormats(info),
            formatStreams: [],
            captions: YoutubeJs.getCaptions(info),
            recommendedVideos: [],
        }
    }

    static getAdaptiveFormats(videoInfo: VideoInfo) {
        if (!videoInfo.streaming_data.adaptive_formats) {
            return [];
        }

        return videoInfo.streaming_data.adaptive_formats.map(format => {
            const formatInfo = FORMATS[format.itag];
            const result: any = {
                init: format.init_range ? `${format.init_range.start}-${format.init_range.end}` : "",
                index: format.index_range ? `${format.index_range.start}-${format.index_range.end}` : "",
                bitrate: `${format.bitrate}`,
                url: format.decipher(YoutubeJs.innerTube.session.player),
                itag: `${format.itag}`,
                type: format.mime_type,
                clen: `${format.approx_duration_ms}`,
                lmt: `${format.last_modified}`,
                container: formatInfo?.ext,
                encoding: formatInfo?.acodec ?? formatInfo?.vcodec,
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
            if (format.height && format.width) {
                result.size = `${format.width}x${format.height}`;
                result.resolution = `${format.height}p`;
            } else if (formatInfo?.height && formatInfo?.width) {
                result.size = `${formatInfo.width}x${formatInfo.height}`;
                result.resolution = `${formatInfo.height}p`;
            }

            return result;
        });
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