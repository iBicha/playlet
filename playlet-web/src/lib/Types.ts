export const ScreenNames = ["search", "home", "bookmarks", "settings", "info", "remote"] as const;

export type AppState = {
    screen: "search" | "home" | "bookmarks" | "settings" | "info" | "remote"
}

export type PlayletState = {
    app?: any,
    device?: any,
    invidious?: any,
    preferences?: any,
}
