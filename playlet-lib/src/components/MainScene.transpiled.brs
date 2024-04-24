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
        "YouTube has made changes that broke 3rd party apps, which is affecting Playlet and Invidious."
        "Some videos might not play, and you might see error messages often."
        "We're aware of the issue, and working on a fix."
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