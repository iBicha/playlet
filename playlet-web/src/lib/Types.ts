export type AppState = {
    screen: "search" | "home" | "bookmarks" | "settings" | "info"
}

export type PlayletState = {
    app?: any,
    device?: any,
    invidious?: any,
    preferences?: any,
}
