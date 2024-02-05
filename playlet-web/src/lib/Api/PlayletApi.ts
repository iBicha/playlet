import { getHost } from "lib/Api/Host";

export class PlayletApi {
    static host = () => `http://${getHost()}`

    static async getState() {
        const response = await fetch(`${PlayletApi.host()}/api/state`);
        return await response.json();
    }

    static async getPreferencesFile() {
        const response = await fetch(`${PlayletApi.host()}/config/preferences.json5`);
        return await response.json();
    }

    // Home layout is the home layout file, but with the user's preferences applied.
    static async getHomeLayout() {
        const response = await fetch(`${PlayletApi.host()}/api/home-layout`);
        return await response.json();
    }

    static async getHomeLayoutFile() {
        const response = await fetch(`${PlayletApi.host()}/config/default_home_layout.yaml`);
        return await response.json();
    }

    static async getInvidiousVideoApiFile() {
        const response = await fetch(`${PlayletApi.host()}/config/invidious_video_api.yaml`);
        return await response.json();
    }

    static async getLocalVideoApiFile() {
        const response = await fetch(`${PlayletApi.host()}/config/local_video_api.yaml`);
        return await response.json();
    }

    static async invidiousAuthenticatedRequest(feedSource) {
        const url = PlayletApi.host() + "/invidious/authenticated-request?feed-source=" + encodeURIComponent(JSON.stringify(feedSource));
        const response = await fetch(url);
        return await response.json();
    }

    static async getUserPreferences() {
        const response = await fetch(`${PlayletApi.host()}/api/preferences`);
        return await response.json();
    }

    static async saveUserPreference(key, value) {
        const response = await this.putJson(`${PlayletApi.host()}/api/preferences`, { [key]: value });
        return await response;
    }

    static async logout() {
        await fetch(`${PlayletApi.host()}/invidious/logout`);
    }

    static async playVideo(args) {
        if (!args.videoId) {
            return;
        }

        if (args.timestamp !== undefined) {
            if (typeof args.timestamp === "string") {
                args.timestamp = parseInt(args.timestamp);
            }
        }
        await PlayletApi.postJson(`${PlayletApi.host()}/api/queue/play`, args);
    }

    static async playPlaylist(args) {
        if (!args.playlistId) {
            return;
        }

        await PlayletApi.postJson(`${PlayletApi.host()}/api/queue/play`, args);
    }

    static async queueVideo(args) {
        if (!args.videoId) {
            return;
        }

        if (args.timestamp !== undefined) {
            if (typeof args.timestamp === "string") {
                args.timestamp = parseInt(args.timestamp);
            }
        }
        const response = await PlayletApi.postJson(`${PlayletApi.host()}/api/queue`, args);
        return await response.json();
    }

    static async queuePlaylist(args) {
        if (!args.playlistId) {
            return;
        }
        const response = await PlayletApi.postJson(`${PlayletApi.host()}/api/queue`, args);
        return await response.json();
    }

    static async openPlaylist(playlistId) {
        if (!playlistId) {
            return;
        }
        await fetch(`${PlayletApi.host()}/api/view/open?playlistId=${playlistId}`);
    }

    static async openChannel(authorId) {
        if (!authorId) {
            return;
        }
        await fetch(`${PlayletApi.host()}/api/view/open?authorId=${authorId}`);
    }

    static async getSearchHistory() {
        const response = await fetch(`${PlayletApi.host()}/api/search-history`);
        return await response.json();
    }

    static async addSearchHistory(query: string) {
        const response = await PlayletApi.postJson(`${PlayletApi.host()}/api/search-history`, { query });
        return await response.json();
    }

    static async clearSearchHistory() {
        return await fetch(`${PlayletApi.host()}/api/search-history`, { method: "DELETE" });
    }

    static async clearContinueWatching() {
        return await fetch(`${PlayletApi.host()}/api/continue-watching`, { method: "DELETE" });
    }

    static async getBookmarkFeeds() {
        const response = await fetch(`${PlayletApi.host()}/api/bookmarks/feeds`);
        return await response.json();
    }

    static async setPlayletLibVersion(tag) {
        if (tag !== "") {
            const urls = [{
                link: `https://github.com/iBicha/playlet/releases/download/${tag}/playlet-lib.zip`,
                type: 'custom'
            }]
            // When an official release is out, it replaces the current canary release.
            // To avoid the "not found" error, we fallback to the default "latest" release.
            if (tag === "canary") {
                urls.push({
                    link: `https://github.com/iBicha/playlet/releases/latest/download/playlet-lib.zip`,
                    type: 'custom'
                })
            }
            await PlayletApi.postJson(`${PlayletApi.host()}/api/playlet-lib-urls`, urls);
        } else {
            return await fetch(`${PlayletApi.host()}/api/playlet-lib-urls`, { method: "DELETE" });
        }
    }

    private static postJson(url, payload) {
        return fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify(payload)
        })
    }

    private static putJson(url, payload) {
        return fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "PUT",
            body: JSON.stringify(payload)
        })
    }
}