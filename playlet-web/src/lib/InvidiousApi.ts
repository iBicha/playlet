import { PlayletApi } from "./PlayletApi";

export class InvidiousApi {
    public instance: string;
    public endpoints: any;
    public isLoggedIn: boolean = false;
    public userCountryCode: string = 'US';

    responseHandlers: any;

    constructor() {
        this.responseHandlers = {
            "DefaultHandler": (requestData, response) => this.DefaultHandler(requestData, response),
            "AuthFeedHandler": (requestData, response) => this.AuthFeedHandler(requestData, response),
            "AuthPlaylistsHandler": (requestData, response) => this.AuthPlaylistsHandler(requestData, response),
            "PlaylistHandler": (requestData, response) => this.PlaylistHandler(requestData, response),
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
                    if (queryParam.type === "string") {
                        queryParams[queryParamKey] = queryParam.default;
                    } else if (queryParam.type === "#ISO3166") {
                        if (queryParam.default === "GetUserCountryCode") {
                            queryParams[queryParamKey] = this.userCountryCode;
                        } else {
                            queryParams[queryParamKey] = queryParam.default;
                        }
                    }
                }
            }
        }

        if (requestData.queryParams !== undefined) {
            queryParams = { ...queryParams, ...requestData.queryParams };
        }

        if (requestData.pathParams !== undefined) {
            for (let param in requestData.pathParams) {
                url = url.replace(`:${param}`, requestData.pathParams[param]);
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
        const json = await response.json();
        return [{ title: requestData.title, videos: json }]
    }

    private async AuthFeedHandler(requestData, response) {
        const json = await response.json();
        const videos = [...json.notifications, ...json.videos];
        return [{ title: requestData.title, videos: videos }]
    }

    private async AuthPlaylistsHandler(requestData, response) {
        const playlists = await response.json();
        const result = [];
        for (let i = 0; i < playlists.length; i++) {
            result.push(this.ProcessPlaylist(requestData, playlists[i]));
        }
        return result;
    }

    private async PlaylistHandler(requestData, response) {
        const playlist = await response.json();
        return [this.ProcessPlaylist(requestData, playlist)]
    }

    private ProcessPlaylist(requestData, playlist) {
        const title = this.ProcessTemplate(requestData.title, playlist)
        return { title: title, videos: playlist.videos }
    }

    private ProcessTemplate(template: string, data) {
        let result = template;
        for (let key in data) {
            result = result.replace(`%${key}%`, `${data[key]}`);
        }
        return result;
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
