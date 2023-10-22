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

    public async makeRequest(feed: any) {
        // TODO:P0 handle multiple feed sources
        const feedSource = feed.feedSources[0]

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
