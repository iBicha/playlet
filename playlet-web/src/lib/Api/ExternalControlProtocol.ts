import { getIp } from "./Host";

export class ExternalControlProtocol {
    static async launchApp(appId) {
        return fetch(`http://${getIp()}:8060/launch/${appId}`, {
            method: 'POST',
            body: '',
        })
    }

    static async pressKey(key) {
        return fetch(`http://${getIp()}:8060/keypress/${key}`, {
            method: 'POST',
            body: '',
        })
    }
}
