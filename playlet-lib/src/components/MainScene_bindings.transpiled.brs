' This method is auto-generated!
function InitializeBindings()
    m.top.bindings = {
        fields: {
    
        },
        childProps: {
            "AppController": {
                "root": "./AppRoot", 
                "stack": "./Stack", 
                "videoQueue": "./VideoQueue"
            }, 
            "NavBar": {
                "appController": "/AppController"
            }, 
            "VideoQueue": {
                "appController": "/AppController", 
                "videoContainer": "../VideoContainer", 
                "invidious": "../Invidious", 
                "notifications": "../Notifications", 
                "preferences": "../Preferences", 
                "loungeService": "../LoungeService"
            }, 
            "SearchHistory": {
                "preferences": "../Preferences"
            }, 
            "ProfilesService": {
                "invidious": "../Invidious"
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
                "invidious": "../Invidious", 
                "profilesService": "../ProfilesService", 
                "preferences": "../Preferences", 
                "videoQueue": "../VideoQueue", 
                "bookmarksService": "../BookmarksService", 
                "loungeService": "../LoungeService"
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