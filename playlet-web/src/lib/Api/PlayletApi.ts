import { getHost } from "lib/Api/Host";

const CsrfHeader = "X-Playlet";

export class PlayletApi {
    static host = () => `http://${getHost()}`

    static async getVideoInfo(videoId) {
        const response = await fetch(`${PlayletApi.host()}/playlet-invidious-backend/api/v1/videos/${videoId}?video_info_batched=true`);
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

    static async getSponsorBlockConfigFile() {
        const response = await fetch(`${PlayletApi.host()}/config/sponsorblock_config.json5`);
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
        const response = await PlayletApi.send("PUT", `${PlayletApi.host()}/api/preferences`, { [key]: value });
        return await response;
    }

    static async getProfiles() {
        const response = await fetch(`${PlayletApi.host()}/api/profiles`);
        return await response.json();
    }

    static async activateProfile(profileId) {
        await PlayletApi.send("POST", `${PlayletApi.host()}/api/profiles/activate`, { id: profileId });
    }

    static async logout(profileId) {
        return await PlayletApi.send("DELETE", `${PlayletApi.host()}/api/profiles?id=${profileId}`);
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

        await PlayletApi.send("POST", `${PlayletApi.host()}/api/queue/play`, args);
    }

    static async playPlaylist(args) {
        if (!args.playlistId) {
            return;
        }

        await PlayletApi.send("POST", `${PlayletApi.host()}/api/queue/play`, args);
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

        await PlayletApi.send("POST", `${PlayletApi.host()}/api/queue`, args);
    }

    static async queuePlaylist(args) {
        if (!args.playlistId) {
            return;
        }
        await PlayletApi.send("POST", `${PlayletApi.host()}/api/queue`, args);
    }

    static async openPlaylist(playlistId, continuationVideoId) {
        if (!playlistId) {
            return;
        }
        let url = `${PlayletApi.host()}/api/view/open?playlistId=${playlistId}`;
        if (continuationVideoId) {
            url += `&videoId=${continuationVideoId}`;
        }
        await fetch(url);
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
        const response = await PlayletApi.send("POST", `${PlayletApi.host()}/api/search-history`, { query });
        return await response.json();
    }

    static async clearSearchHistory() {
        return await PlayletApi.send("DELETE", `${PlayletApi.host()}/api/search-history`);
    }

    static async clearCache() {
        return await PlayletApi.send("DELETE", `${PlayletApi.host()}/api/cache`);
    }

    static async getDevicePoToken() {
        const response = await fetch(`${PlayletApi.host()}/api/innertube/potoken`);
        if (!response.ok) {
            const body = await response.text().catch(() => "");
            throw new Error(`Failed to read device poToken (HTTP ${response.status}): ${body}`);
        }
        return await response.json();
    }

    static async sendPoToken(identity: string, poToken: string, mintedAt: number, expiresAt: number) {
        const response = await PlayletApi.send("POST", `${PlayletApi.host()}/api/innertube/potoken`, { identity, poToken, mintedAt, expiresAt });
        if (!response.ok) {
            const body = await response.text().catch(() => "");
            throw new Error(`Device rejected poToken (HTTP ${response.status}): ${body}`);
        }
    }

    static async clearPoTokens() {
        return await PlayletApi.send("DELETE", `${PlayletApi.host()}/api/innertube/potoken/all`);
    }

    static async getBookmarkFeeds() {
        const response = await fetch(`${PlayletApi.host()}/api/bookmarks/feeds`);
        return await response.json();
    }

    static async showExportRegistryCode() {
        await PlayletApi.send("POST", `${PlayletApi.host()}/api/registry/export/code`);
    }

    static async exportRegistry(code: string) {
        const response = await PlayletApi.send("POST", `${PlayletApi.host()}/api/registry/export?code=${encodeURIComponent(code)}`);
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

        const content = await response.text();
        return { filename, content };
    }

    static playletLibUrlsForTag(tag: string) {
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
        return urls;
    }

    static async showSetPlayletLibUrlsCode() {
        const response = await PlayletApi.send("POST", `${PlayletApi.host()}/api/playlet-lib-urls/code`);
        if (!response.ok) {
            throw new Error(`Error from /api/playlet-lib-urls/code: ${response.status} ${await response.text()}`);
        }
    }

    static async setPlayletLibUrls(urls: { link: string, type: string }[], code: string) {
        const response = await PlayletApi.send("POST", `${PlayletApi.host()}/api/playlet-lib-urls?code=${encodeURIComponent(code)}`, urls);
        if (!response.ok) {
            throw new Error(`Error from /api/playlet-lib-urls: ${response.status} ${await response.text()}`);
        }
    }

    static async resetPlayletLibUrls() {
        const response = await PlayletApi.send("DELETE", `${PlayletApi.host()}/api/playlet-lib-urls`);
        if (!response.ok) {
            throw new Error(`Error from /api/playlet-lib-urls: ${response.status} ${await response.text()}`);
        }
    }

    static send(method: "POST" | "PUT" | "DELETE", url: string, payload?: unknown) {
        const headers: Record<string, string> = { [CsrfHeader]: "1" };
        if (payload === undefined) {
            return fetch(url, { method, headers });
        }
        headers["Content-Type"] = "application/json";
        return fetch(url, { method, headers, body: JSON.stringify(payload) });
    }
}