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

    public async search(query: string) {
        const response = await fetch(`${this.instance}/api/v1/search?q=${encodeURIComponent(query)}&region=${this.userCountryCode}`);
        return await response.json();
    }

    public async getVideoMetadata(videoId: string) {
        const response = await fetch(`${this.instance}/api/v1/videos/${videoId}`);
        return await response.json();
    }

    public async makeRequest(requestData: any) {
        if (!requestData || !this.instance || !this.endpoints) {
            return null;
        }

        let endpoint = this.endpoints[requestData.endpoint];
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
            return await PlayletApi.invidiousAuthenticatedRequest(requestData);
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

        if (requestData.queryParams !== undefined) {
            queryParams = { ...queryParams, ...requestData.queryParams };
        }

        if (requestData.pathParams !== undefined) {
            for (let param in requestData.pathParams) {
                url = url.replace(`{${param}}`, requestData.pathParams[param]);
            }
        }

        url = this.makeUrl(url, queryParams);
        const response = await fetch(url, { headers: headers });

        let responseHandler = endpoint.responseHandler !== undefined ? this.responseHandlers[endpoint.responseHandler] : this.responseHandlers["DefaultHandler"];
        if (!responseHandler) {
            return null;
        }
        return await responseHandler(requestData, response);
    }

    private async DefaultHandler(requestData, response) {
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
