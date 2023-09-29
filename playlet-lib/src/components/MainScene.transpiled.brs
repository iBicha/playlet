'import "pkg:/components/EcpArgs.bs"
'import "pkg:/components/parts/AutoBind/AutoBind.part.bs"
'import "pkg:/source/utils/LoadingScreen.bs"
'import "pkg:/source/utils/Logging.bs"

function Init()
    InitializeBindings() ' auto-generated!
    InitializeLogger()
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
end function

function StartWebServer()
    m.webServer = m.top.findNode("WebServer")
    m.webServer.callfunc("StartServer", invalid)
end function'//# sourceMappingURL=./MainScene.bs.map