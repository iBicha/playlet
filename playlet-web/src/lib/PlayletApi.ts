import { getHost } from "./Host";

export class PlayletApi {
    static host = () => `http://${getHost()}`

    static async getState() {
        const response = await fetch(`${PlayletApi.host()}/api/state`)
        return await response.json()
    }
}