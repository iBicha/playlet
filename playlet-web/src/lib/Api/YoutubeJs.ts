import { Innertube } from 'youtubei.js/web';
import { getHost } from "lib/Api/Host";

export class YoutubeJs {
    static host = () => `http://${getHost()}`

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
                            CacheSeconds: -1,
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

    static async getVideoInfo(videoId: string) {
        await this.init();
        const info = await YoutubeJs.innerTube.getBasicInfo(videoId, 'IOS');

        console.log('[YTJS] info:', info);

        if (info.playability_status.status !== 'OK') {
            let errorMessage = "";
            if (info.playability_status.reason) {
                errorMessage = info.playability_status.reason;
            }
            if (info.playability_status.error_screen) {
                if (info.playability_status.error_screen.hasKey('subreason')) {
                    const subreason = info.playability_status.error_screen.subreason;
                    if (subreason?.text && typeof subreason.text === 'string') {
                        errorMessage += `\n` + subreason.text;
                    }
                }
            }

            throw new Error(errorMessage);
        }

        // Populate a video object that is similar to Invidious format.
        // Mostly populate only fields we care about, enough to make it work.
        return {
            type: "video",
            title: info.basic_info.title,
            videoId: info.basic_info.id,
            videoThumbnails: [{
                quality: "medium",
                url: `https://i.ytimg.com/vi/${info.basic_info.id}/mqdefault.jpg`,
                width: 320,
                height: 180
            }],
            storyboards: [],
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
            dashUrl: "",
            hlsUrl: info.streaming_data.hls_manifest_url,
            adaptiveFormats: [],
            formatStreams: [],
            captions: [],
            recommendedVideos: [],
        }
    }
}
