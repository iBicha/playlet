' This method is auto-generated!
function InitializeBindings()
    m.top.bindings = {
        fields: {
    
        },
        childProps: {
            "AppController": {
                "screensContainer": "./AppScreens", 
                "root": "./AppRoot", 
                "stack": "./Stack", 
                "videoQueue": "./VideoQueue"
            }, 
            "NavBar": {
                "appController": "/AppController", 
                "screensContainer": "../AppScreens"
            }, 
            "VideoQueue": {
                "appController": "/AppController", 
                "videoContainer": "../VideoContainer", 
                "innertube": "../Innertube", 
                "invidious": "../Invidious", 
                "notifications": "../Notifications", 
                "preferences": "../Preferences", 
                "loungeService": "../LoungeService", 
                "jobQueue": "/JobQueue"
            }, 
            "SearchHistory": {
                "preferences": "../Preferences"
            }, 
            "ProfilesService": {
                "invidious": "../Invidious"
            }, 
            "Innertube": {
                "jobQueue": "/JobQueue"
            }, 
            "Invidious": {
                "webServer": "../WebServer", 
                "applicationInfo": "../ApplicationInfo", 
                "preferences": "../Preferences", 
                "profilesService": "../ProfilesService"
            }, 
            "WebServer": {
                "appController": "/AppController", 
                "applicationInfo": "../ApplicationInfo", 
                "innertube": "../Innertube", 
                "invidious": "../Invidious", 
                "profilesService": "../ProfilesService", 
                "preferences": "../Preferences", 
                "videoQueue": "../VideoQueue", 
                "bookmarksService": "../BookmarksService", 
                "loungeService": "../LoungeService", 
                "jobQueue": "/JobQueue"
            }, 
            "DialServer": {
                "webServer": "../WebServer", 
                "loungeService": "../LoungeService"
            }, 
            "LoungeService": {
                "videoQueue": "../VideoQueue", 
                "notifications": "../Notifications", 
                "invidious": "../Invidious"
            }
        }
    }
end function
'//# sourceMappingURL=./MainScene_bindings.brs.map