import { getHost } from "./Host";

export class PlayletApi {
    static host = () => `http://${getHost()}`

    static async getState() {
        const response = await fetch(`${PlayletApi.host()}/api/state`);
        return await response.json();
    }

    static async logout() {
        return await PlayletApi.postJson(`${PlayletApi.host()}/api/command`, { command: "logout" });
    }

    static async playVideo(videoId) {
        return await PlayletApi.postJson(`${PlayletApi.host()}/api/command`, { command: "play", videoId: videoId });
    }

    static async clearSearchHistory() {
        return await PlayletApi.postJson(`${PlayletApi.host()}/api/command`, { command: "clear-search-history" });
    }

    static async updateInstances(instances) {
        return await PlayletApi.postJson(`${PlayletApi.host()}/invidious/instances`, instances);
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
}