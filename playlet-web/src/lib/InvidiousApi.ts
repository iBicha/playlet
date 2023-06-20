export class InvidiousApi {
    public instance: string;
    public endpoints: any;

    responseHandlers: any;

    constructor() {
        this.responseHandlers = {
            "DefaultHandler": this.DefaultHandler,
            "AuthFeedHandler": this.AuthFeedHandler,
        }
    }
    // TODO: user country code

    public async searchSuggestions(query: string) {
        const response = await fetch(`${this.instance}/api/v1/search/suggestions?q=${encodeURIComponent(query)}`);
        return await response.json();
    }

    public async search(query: string) {
        const response = await fetch(`${this.instance}/api/v1/search?q=${encodeURIComponent(query)}`);
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
        let params = {}

        if (requestData.authenticated) {
            // TODO authenticated calls, with token
            return null;
        }

        if (endpoint.queryParams !== undefined) {
            for (let queryParamKey in endpoint.queryParams) {
                let queryParam = endpoint.queryParams[queryParamKey];
                if (queryParam.default !== undefined) {
                    if (queryParam.type === "string") {
                        params[queryParamKey] = queryParam.default;
                    } else if (queryParam.type === "#ISO3166") {
                        if (queryParam.default === "GetUserCountryCode") {
                            params[queryParamKey] = 'US'; // TODO: user country code
                        } else {
                            params[queryParamKey] = queryParam.default;
                        }
                    }
                }
            }
        }

        if (requestData.queryParams !== undefined) {
            params = { ...params, ...requestData.queryParams };
        }

        if (requestData.pathParams !== undefined) {
            for (let param in requestData.pathParams) {
                url = url.replace(`:${param}`, requestData.pathParams[param]);
            }
        }

        url = this.makeUrl(url, params);
        const response = await fetch(url);

        let responseHandler = endpoint.responseHandler !== undefined ? this.responseHandlers[endpoint.responseHandler] : this.responseHandlers["DefaultHandler"];
        if (!responseHandler ) {
            return null;
        }
        return await responseHandler(requestData, response);
    }

    async DefaultHandler(requestData, response) {
        return await response.json();
    }

    async AuthFeedHandler(requestData, response) {
        const json = await response.json();
        return [...json.notifications, ...json.videos];
    }

    makeUrl(url: string, queryParams: any) {
        const params = new URLSearchParams(queryParams);
        const encodedParams = params.toString();

        const encodedUrl = new URL(url);
        encodedUrl.search = encodedParams;

        return encodedUrl.toString();
    }
}