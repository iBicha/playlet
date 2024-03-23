import { tr } from "lib/Stores";
import { PlayletApi } from "./PlayletApi";
import { get } from "svelte/store";

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

export function getPluralString(c: number, zeroString: string, oneString: string, pluralString: string) {
    const trFn = get(tr);

    c = c || 0;
    if (c === 0) {
        return trFn(zeroString);
    } else if (c === 1) {
        return trFn(oneString);
    } else {
        return trFn(pluralString).replace("^n", c.toString());
    }
}

export function getFormattedPluralString(c: number, zeroString: string, oneString: string, pluralString: string) {
    const trFn = get(tr);

    c = c || 0;
    if (c === 0) {
        return trFn(zeroString);
    } else if (c === 1) {
        return trFn(oneString);
    } else {
        if (c < 1000) {
            return trFn(pluralString).replace("^n", parseFloat(c.toFixed(1)).toString());
        }
        c = c / 1000;
        if (c < 1000) {
            return trFn(pluralString).replace("^n", parseFloat(c.toFixed(1)).toString() + " K");
        }
        c = c / 1000;
        if (c < 1000) {
            return trFn(pluralString).replace("^n", parseFloat(c.toFixed(1)).toString() + " M");
        }
        c = c / 1000;
        return trFn(pluralString).replace("^n", parseFloat(c.toFixed(1)).toString() + " B");
    }
}