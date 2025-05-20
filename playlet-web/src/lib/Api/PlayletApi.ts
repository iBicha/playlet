import { getHost } from "lib/Api/Host";

export class PlayletApi {
    static host = () => `http://${getHost()}`

    static async getVideoInfo(videoId) {
        const response = await fetch(`${PlayletApi.host()}/playlet-invidious-backend/api/v1/videos/${videoId}`);
        return await response.json();
    }

    static async getState() {
        const response = await fetch(`${PlayletApi.host()}/api/state`);
        return await response.json();
    }

    static async getLocale(locale: string) {
        const response = await fetch(`${PlayletApi.host()}/locale/${locale}/translations.ts`);
        return await response.text();
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

    static async getProfiles() {
        const response = await fetch(`${PlayletApi.host()}/api/profiles`);
        return await response.json();
    }

    static async activateProfile(profileId) {
        await this.postJson(`${PlayletApi.host()}/api/profiles/activate`, { id: profileId });
    }

    static async logout(profileId) {
        return await fetch(`${PlayletApi.host()}/api/profiles?id=${profileId}`, { method: "DELETE" });
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

        if (args.percentDurationWatched !== undefined) {
            if (typeof args.percentDurationWatched === "string") {
                args.percentDurationWatched = parseFloat(args.percentDurationWatched);
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

        if (args.percentDurationWatched !== undefined) {
            if (typeof args.percentDurationWatched === "string") {
                args.percentDurationWatched = parseFloat(args.percentDurationWatched);
            }
        }

        await PlayletApi.postJson(`${PlayletApi.host()}/api/queue`, args);
    }

    static async queuePlaylist(args) {
        if (!args.playlistId) {
            return;
        }
        await PlayletApi.postJson(`${PlayletApi.host()}/api/queue`, args);
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

    static async clearCache() {
        return await fetch(`${PlayletApi.host()}/api/cache`, { method: "DELETE" });
    }

    static async getBookmarkFeeds() {
        const response = await fetch(`${PlayletApi.host()}/api/bookmarks/feeds`);
        return await response.json();
    }

    static async showExportRegistryCode() {
        await fetch(`${PlayletApi.host()}/api/registry/export/code`);
    }

    static async exportRegistry(code: string) {
        const response = await fetch(`${PlayletApi.host()}/api/registry/export?code=${code}`);
        if (!response.ok) {
            const error = `Error from /api/registry/export: ${response.statusText}`;
            console.error(error);
            throw new Error(error);
        }

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'playlet-registry.json';

        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match && match[1]) {
                filename = match[1];
            }
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        try {
            a.href = url;
            a.download = filename;
            a.click();
        } catch (error) {
            throw error;
        } finally {
            a.remove();
            URL.revokeObjectURL(url);
        }
    }

    static async setPlayletLibVersion(tag) {
        if (tag !== "") {
            const urls = [{
                link: `https://github.com/iBicha/playlet/releases/download/${tag}/playlet-lib.squashfs.pkg`,
                type: 'custom'
            }, {
                link: `https://github.com/iBicha/playlet/releases/download/${tag}/playlet-lib.zip`,
                type: 'custom'
            }]
            // When an official release is out, it replaces the current canary release.
            // To avoid the "not found" error, we fallback to the default "latest" release.
            if (tag === "canary") {
                urls.push({
                    link: `https://github.com/iBicha/playlet/releases/latest/download/playlet-lib.squashfs.pkg`,
                    type: 'custom'
                }, {
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