import { tr } from "lib/Stores";
import { PlayletApi } from "./PlayletApi";

export async function fetchLocale(locale: string) {
    try {
        if (!locale) {
            return;
        }
        const localeFile = await PlayletApi.getLocale(locale);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(localeFile, "text/xml");
        const context = xmlDoc.getElementsByTagName("context");
        if (context.length === 0) {
            return;
        }
        const messages = context[0].getElementsByTagName("message");
        if (messages.length === 0) {
            return;
        }
        const translations = {};
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const source = message.getElementsByTagName("source");
            if (source.length === 0) {
                continue;
            }
            const translation = message.getElementsByTagName("translation");
            if (translation.length === 0) {
                continue;
            }
            translations[source[0].textContent] = translation[0].textContent;
        }
        tr.set((s) => translations[s] || s);
    } catch (error) {
        console.error(error);
    }
}
