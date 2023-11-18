import { getIp } from "./Host";

export class ExternalControlProtocol {
    static async launchApp(appId) {
        console.log("Launching app", appId)
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

    static async pressKeyUp(key) {
        console.log("Pressing key up", key)
        return fetch(`http://${getIp()}:8060/keyup/${key}`, {
            method: 'POST',
            body: '',
        })
    }

    static async pressKeyDown(key) {
        console.log("Pressing key down", key)
        return fetch(`http://${getIp()}:8060/keydown/${key}`, {
            method: 'POST',
            body: '',
        })
    }
}
