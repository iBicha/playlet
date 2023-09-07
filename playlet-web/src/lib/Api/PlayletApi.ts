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

    static async getHomeLayoutFile() {
        const response = await fetch(`${PlayletApi.host()}/config/default_home_layout.json5`);
        return await response.json();
    }

    static async getInvidiousVideoApiFile() {
        const response = await fetch(`${PlayletApi.host()}/config/invidious_video_api.json5`);
        return await response.json();
    }

    static async invidiousAuthenticatedRequest(requestData) {
        const url = PlayletApi.host() + "/invidious/authenticated-request?request-data=" + encodeURIComponent(JSON.stringify(requestData));
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

    static async playVideo(videoId, timestamp, title, author) {
        if (!videoId) {
            return;
        }
        const args = { videoId };
        if (timestamp !== undefined) {
            if (typeof timestamp === "string") {
                timestamp = parseInt(timestamp);
            }
            args["timestamp"] = timestamp;
        }
        if (title !== undefined) {
            args["title"] = title;
        }
        if (author !== undefined) {
            args["author"] = author;
        }

        await PlayletApi.postJson(`${PlayletApi.host()}/api/player/play`, args);
    }

    static async queueVideo(videoId, timestamp, title, author) {
        if (!videoId) {
            return;
        }
        const args = { videoId };
        if (timestamp !== undefined) {
            if (typeof timestamp === "string") {
                timestamp = parseInt(timestamp);
            }
            args["timestamp"] = timestamp;
        }
        if (title !== undefined) {
            args["title"] = title;
        }
        if (author !== undefined) {
            args["author"] = author;
        }
        const response = await PlayletApi.postJson(`${PlayletApi.host()}/api/player/queue`, args);
        return await response.json();
    }

    static async getSearchHistory() {
        const response = await fetch(`${PlayletApi.host()}/api/search-history`);
        return await response.json();
    }

    static async putSearchHistory(query: string) {
        const response = await PlayletApi.putJson(`${PlayletApi.host()}/api/search-history`, { query });
        return await response.json();
    }

    static async clearSearchHistory() {
        return await fetch(`${PlayletApi.host()}/api/search-history`, { method: "DELETE" });
    }

    static async updateInstance(instance) {
        return await PlayletApi.putJson(`${PlayletApi.host()}/api/preferences`, { "invidious.instance": instance });
    }

    static async setPlayletLibVersion(tag) {
        if (tag !== "") {
            const urls = [{
                link: `https://github.com/iBicha/playlet/releases/download/${tag}/playlet-lib.zip`,
                type: 'custom'
            }]
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