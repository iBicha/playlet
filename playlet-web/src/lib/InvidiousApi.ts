export class InvidiousApi {
    public instance: string;

    // TODO: user country code

    public async searchSuggestions(query: string) {
        const response = await fetch(`${this.instance}/api/v1/search/suggestions?q=${encodeURIComponent(query)}`);
        return await response.json();
    }

    public async search(query: string) {
        const response = await fetch(`${this.instance}/api/v1/search?q=${encodeURIComponent(query)}`);
        return await response.json();
    }
}