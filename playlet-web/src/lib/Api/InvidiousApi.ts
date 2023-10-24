import { PlayletApi } from "lib/Api/PlayletApi";

export class InvidiousApi {
    public instance: string;
    public endpoints: any;
    public isLoggedIn: boolean = false;
    public userCountryCode: string = 'US';

    responseHandlers: any;

    constructor() {
        // Note: handlers for authenticated requests are not needed, since they are handled server side
        this.responseHandlers = {
            "DefaultHandler": (requestData, response) => this.DefaultHandler(requestData, response),
            "PlaylistHandler": (requestData, response) => this.PlaylistHandler(requestData, response),
            "VideoInfoHandler": (requestData, response) => this.VideoInfoHandler(requestData, response),
            "PlaylistInfoHandler": (requestData, response) => this.PlaylistInfoHandler(requestData, response),
            "ChannelInfoHandler": (requestData, response) => this.ChannelInfoHandler(requestData, response),
            "ChannelVideosHandler": (requestData, response) => this.ChannelVideosHandler(requestData, response),
            "ChannelPlaylistsHandler": (requestData, response) => this.ChannelPlaylistsHandler(requestData, response),
            "ChannelRelatedChannelsHandler": (requestData, response) => this.ChannelRelatedChannelsHandler(requestData, response),
        }
    }

    public async searchSuggestions(query: string) {
        const response = await fetch(`${this.instance}/api/v1/search/suggestions?q=${encodeURIComponent(query)}&region=${this.userCountryCode}`);
        return await response.json();
    }

    public async search(query: string, filters: any) {
        let url = `${this.instance}/api/v1/search?q=${encodeURIComponent(query)}&region=${this.userCountryCode}`;
        for (let filter in filters) {
            if (typeof filters[filter] === 'string') {
                if (filters[filter] === '') {
                    continue;
                }
                url += `&${filter}=${filters[filter]}`;
            } else {
                if (filters[filter].length === 0) {
                    continue;
                }
                url += `&${filter}=${filters[filter].join(',')}`;
            }
        }
        const response = await fetch(url);
        return await response.json();
    }

    public async getVideoMetadata(videoId: string) {
        const response = await fetch(`${this.instance}/api/v1/videos/${videoId}`);
        return await response.json();
    }

    public async markFeedSourcePagination(feedSource: any) {
        const endpoint = this.endpoints[feedSource.endpoint]
        if (!endpoint || !endpoint.paginationType) {
            return;
        }

        const feedSourceState = feedSource.state
        feedSourceState.queryParams = feedSourceState.queryParams || {}

        feedSourceState.paginationType = endpoint.paginationType

        if (feedSourceState.paginationType === "Pages") {
            if (!Number.isInteger(feedSourceState.page)) {
                feedSourceState.page = 0;
            }
            feedSourceState.page += 1;
            feedSourceState.queryParams.page = feedSourceState.page;
        } else if (feedSourceState.paginationType === "Continuation") {
            const continuation = feedSourceState.continuation;
            if (continuation) {
                feedSourceState.queryParams.continuation = continuation;
            } else {
                delete feedSourceState.queryParams.continuation;
            }
        }
    }

    public canMakeRequest() {
        return !!(this.instance && this.endpoints && Object.keys(this.endpoints).length);
    }

    public async makeRequest(feedSource: any) {
        // TODO:P0 implement localStorage caching
        if (!feedSource || !this.instance || !this.endpoints) {
            return null;
        }

        let endpoint = this.endpoints[feedSource.endpoint];
        if (!endpoint) {
            return null;
        }

        let url = this.instance + endpoint.url
        let queryParams = {}
        let headers = {}

        if (endpoint.authenticated) {
            // Authenticated requests on the web app would be blocked by CORS, so we use the Playlet API as a proxy
            if (!this.isLoggedIn) {
                return null;
            }
            return await PlayletApi.invidiousAuthenticatedRequest(feedSource);
        }

        if (endpoint.queryParams !== undefined) {
            for (let queryParamKey in endpoint.queryParams) {
                let queryParam = endpoint.queryParams[queryParamKey];
                if (queryParam.default !== undefined) {
                    if (queryParam.type === "#ISO3166") {
                        if (queryParam.default === "GetUserCountryCode") {
                            queryParams[queryParamKey] = this.userCountryCode;
                        } else {
                            queryParams[queryParamKey] = queryParam.default;
                        }
                    } else {
                        queryParams[queryParamKey] = queryParam.default;
                    }
                }
            }
        }

        if (feedSource.queryParams !== undefined) {
            queryParams = { ...queryParams, ...feedSource.queryParams };
        }

        if (feedSource.state.queryParams !== undefined) {
            queryParams = { ...queryParams, ...feedSource.state.queryParams };
        }

        if (feedSource.pathParams !== undefined) {
            for (let param in feedSource.pathParams) {
                url = url.replace(`{${param}}`, feedSource.pathParams[param]);
            }
        }

        url = this.makeUrl(url, queryParams);
        const response = await fetch(url, { headers: headers });

        let responseHandler = endpoint.responseHandler !== undefined ? this.responseHandlers[endpoint.responseHandler] : this.responseHandlers["DefaultHandler"];
        if (!responseHandler) {
            return null;
        }
        return await responseHandler(feedSource, response);
    }

    private async DefaultHandler(feedSource, response) {
        const items = await response.json();
        return { items };
    }

    private async PlaylistHandler(feedSource, response) {
        const json = await response.json();
        return {
            items: json.videos,
        };
    }

    private async VideoInfoHandler(feedSource, response) {
        const info = await response.json();
        info.type = "video";
        return { items: [info] };
    }

    private async ChannelInfoHandler(feedSource, response) {
        const info = await response.json();
        info.type = "channel";
        return { items: [info] };
    }

    private async PlaylistInfoHandler(feedSource, response) {
        const info = await response.json();
        info.type = "playlist";
        return { items: [info] };
    }

    private async ChannelVideosHandler(feedSource, response) {
        const json = await response.json();
        return {
            items: json.videos,
            continuation: json.continuation
        };
    }

    private async ChannelPlaylistsHandler(feedSource, response) {
        const json = await response.json();
        return {
            items: json.playlists,
            continuation: json.continuation
        };
    }

    private async ChannelRelatedChannelsHandler(feedSource, response) {
        const json = await response.json();
        return {
            items: json.relatedChannels,
            continuation: json.continuation
        };
    }

    private makeUrl(url: string, params: any) {
        const encodedUrl = new URL(url);
        const existingParams = new URLSearchParams(encodedUrl.search);

        let mergedParams = new URLSearchParams({
            ...Object.fromEntries(existingParams),
            ...params
        });

        encodedUrl.search = mergedParams.toString();
        return encodedUrl.toString();
    }
}
