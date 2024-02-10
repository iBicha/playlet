' This method is auto-generated!
function InitializeBindings()
    m.top.bindings = {
        fields: {
    
        },
        childProps: {
            "AppController": {
                "root": "./AppRoot", 
                "stack": "./Stack", 
                "playQueue": "./PlayQueue"
            }, 
            "NavBar": {
                "appController": "/AppController"
            }, 
            "PlayQueue": {
                "invidious": "../Invidious", 
                "notifications": "../Notifications", 
                "preferences": "../Preferences", 
                "continueWatching": "../ContinueWatching"
            }, 
            "SearchHistory": {
                "preferences": "../Preferences"
            }, 
            "ContinueWatching": {
                "preferences": "../Preferences"
            }, 
            "Invidious": {
                "webServer": "../WebServer", 
                "applicationInfo": "../ApplicationInfo", 
                "preferences": "../Preferences"
            }, 
            "WebServer": {
                "appController": "/AppController", 
                "applicationInfo": "../ApplicationInfo", 
                "invidious": "../Invidious", 
                "preferences": "../Preferences", 
                "playQueue": "../PlayQueue", 
                "bookmarks": "../Bookmarks", 
                "continueWatching": "../ContinueWatching"
            }
        }
    }
end function
'//# sourceMappingURL=./MainScene_bindings.brs.map