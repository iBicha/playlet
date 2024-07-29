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
        }
    }

    public async searchSuggestions(query: string) {
        const url = `${this.instance}/api/v1/search/suggestions?q=${encodeURIComponent(query)}&region=${this.userCountryCode}`;
        return await this.cachedFetch(url, 60 * 60 * 24);
    }

    public async search(query: string, filters: any, page: number = 1) {
        // TODO:P2 use a FeedSource similar to brightscript version
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
        url += `&page=${page}`;
        const response = await fetch(url);
        return await response.json();
    }

    public async getVideoMetadata(videoId: string, refresh: boolean = true) {
        const response = await fetch(`${this.instance}/api/v1/videos/${videoId}?refresh=${refresh}`);
        return await response.json();
    }

    public async getChannelMetadata(ucid: string) {
        const response = await fetch(`${this.instance}/api/v1/channels/${ucid}`);
        return await response.json();
    }

    public async resolveUrl(url: string) {
        const response = await fetch(`${this.instance}/api/v1/resolveurl?url=${encodeURIComponent(url)}`);
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

    // TODO:P1 handle QueryParamArrayType (CommaSeparated/Repeated)
    public async makeRequest(feedSource: any) {
        if (!feedSource || !this.instance || !this.endpoints) {
            return null;
        }

        let endpoint = this.endpoints[feedSource.endpoint];
        if (!endpoint) {
            return null;
        }

        let url = this.instance + endpoint.url
        let queryParams = {}

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

        let cacheSeconds = undefined
        if (feedSource.cacheSeconds !== undefined) {
            cacheSeconds = feedSource.cacheSeconds
        } else if (endpoint.cacheSeconds !== undefined) {
            cacheSeconds = endpoint.cacheSeconds
        }

        let tryCount = 1;
        if (feedSource.tryCount !== undefined) {
            tryCount = feedSource.tryCount
        } else if (endpoint.tryCount !== undefined) {
            tryCount = endpoint.tryCount
        }

        const responseJson = await this.cachedFetch(url, cacheSeconds, tryCount);

        let responseHandler = endpoint.responseHandler !== undefined ? this.responseHandlers[endpoint.responseHandler] : this.responseHandlers["DefaultHandler"];
        if (!responseHandler) {
            return null;
        }
        return await responseHandler(feedSource, responseJson);
    }

    private async DefaultHandler(feedSource, responseJson) {
        return { items: responseJson };
    }

    private async PlaylistHandler(feedSource, responseJson) {
        return {
            items: responseJson.videos,
        };
    }

    private async VideoInfoHandler(feedSource, responseJson) {
        responseJson.type = "video";
        return { items: [responseJson] };
    }

    private async ChannelInfoHandler(feedSource, responseJson) {
        responseJson.type = "channel";
        return { items: [responseJson] };
    }

    private async PlaylistInfoHandler(feedSource, responseJson) {
        responseJson.type = "playlist";
        return { items: [responseJson] };
    }

    private async ChannelVideosHandler(feedSource, responseJson) {
        return {
            items: responseJson.videos,
            continuation: responseJson.continuation
        };
    }

    private async ChannelPlaylistsHandler(feedSource, responseJson) {
        return {
            items: responseJson.playlists,
            continuation: responseJson.continuation
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

    private async cachedFetch(url: string, cacheSeconds?: number, tryCount: number = 1) {
        if (cacheSeconds) {
            const cache = this.getCache(url, cacheSeconds);
            if (cache) {
                return cache;
            }
        }

        try {
            tryCount -= 1;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const data = await response.json();
            this.setCache(url, data);
            return data;

        } catch (error) {
            console.error(error);
        }

        while (tryCount > 0) {
            tryCount -= 1;
            let backOffMs = 1000 + Math.floor(Math.random() * (3000 - 1000));
            console.log(`Retrying ${url} in ${backOffMs}ms`);
            await new Promise(resolve => setTimeout(resolve, backOffMs));

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                const data = await response.json();
                this.setCache(url, data);
                return data;
            } catch (error) {
                console.error(error);
            }
        }
    }

    public static clearCache() {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith("v1:")) {
                localStorage.removeItem(key);
            }
        }
    }

    // TODO:P2 use more appropriate cache storage
    private getCache(url: string, cacheSeconds: number) {
        const cacheKey = this.getCacheKey(url);
        const cache = localStorage.getItem(cacheKey);
        if (!cache) {
            return null;
        }

        try {
            const cacheData = JSON.parse(cache);
            if (cacheData.timestamp + cacheSeconds * 1000 < Date.now()) {
                this.deleteCache(url);
                return null;
            }
            console.log(`Cache hit for ${url}`);
            return cacheData.data;
        } catch (error) {
            console.error(error);
            this.deleteCache(url);
            return null;
        }
    }

    private setCache(url: string, data: any) {
        const cacheKey = this.getCacheKey(url);
        const cacheData = {
            __version: 1,
            timestamp: Date.now(),
            data
        };

        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }

    private deleteCache(url: string) {
        const cacheKey = this.getCacheKey(url);
        localStorage.removeItem(cacheKey);
    }

    private getCacheKey(url: string) {
        return `v1:${url}`;
    }
}
