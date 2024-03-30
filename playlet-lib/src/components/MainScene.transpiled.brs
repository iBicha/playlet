'import "Dialog/DialogUtils.bs"
'import "pkg:/components/EcpArgs.bs"
'import "pkg:/components/parts/AutoBind/AutoBind.part.bs"
'import "pkg:/components/parts/AutoBind/OnNodeReadyNoOp.bs"
'import "pkg:/source/utils/LoadingScreen.bs"

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
    DialogUtils_ShowDialog("Invidious is currently experiencing a major outage affecting all public and private instances." + chr(10) + "Playing videos might not work." + chr(10) + "Please be patient while the issue is being resolved." + chr(10) + "We apologize for the inconvenience." + chr(10) + "Issue url: https://github.com/iv-org/invidious/issues/4498", "Announcement", true)
end function
'//# sourceMappingURL=./MainScene.brs.map