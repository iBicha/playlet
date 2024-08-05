'import "pkg:/components/EcpArgs.bs"
'import "pkg:/components/parts/AutoBind/AutoBind.part.bs"
'import "pkg:/components/parts/AutoBind/OnNodeReadyNoOp.bs"
'import "pkg:/source/utils/LoadingScreen.bs"
'import "pkg:/source/utils/Locale.bs"

function Init()
    InitializeBindings() ' auto-generated!
    m.scene = m.top.getScene()
    ' At this point, the "MainScene" node is not yet added to the scene, and does not have a parent yet.
    ' Let's wait until it has one.
    m.MainSceneContainer = m.scene.findNode("MainSceneContainer")
    m.MainSceneContainer.ObserveField("change", FuncName(MainSceneContainerChanged))
end function

function MainSceneContainerChanged()
    AutoBindSceneGraph()
    StartWebServer()
    HideLoadingScreen()
    InitEcpArgs()
    m.scene.signalBeacon("AppLaunchComplete")
    CopyLoadingMessagesToCache()
    ShowAnnouncement()
end function

function StartWebServer()
    m.loungeService = m.top.findNode("LoungeService")
    m.loungeService.callfunc("StartService", invalid)
    m.webServer = m.top.findNode("WebServer")
    m.webServer.callfunc("StartServer", invalid)
    m.dialServer = m.top.findNode("DialServer")
    m.dialServer.callfunc("StartServer", invalid)
end function

function ShowAnnouncement()
    title = "Announcement"
    message = [
        "Hello again!"
        "Invidious servers are actively getting blocked by YouTube."
        "If you see the error message " + chr(34) + "This helps protect our community. Learn more" + chr(34) + " when playing a video, try changing the Invidious instance in the settings."
        "This is a known issue and the Invidious dev team is working to fix it."
        "See more information at https://github.com/iv-org/invidious/issues/4734"
        "We apologize for the inconvenience."
    ]
    buttons = [
        Tr("OK")
    ]
    dialog = CreateObject("roSGNode", "SimpleDialog")
    dialog.title = title
    dialog.message = message
    dialog.buttons = buttons
    deviceInfo = CreateObject("roDeviceInfo")
    displaySize = deviceInfo.GetDisplaySize()
    dialog.width = displaySize.w - 180
    m.top.getScene().dialog = dialog
end function
'//# sourceMappingURL=./MainScene.brs.map