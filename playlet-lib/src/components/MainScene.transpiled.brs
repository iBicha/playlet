'import "pkg:/components/parts/AutoBind/AutoBind.part.bs"
'import "pkg:/source/utils/LoadingScreen.bs"
'import "pkg:/source/utils/Logging.bs"

function Init()
    InitializeBindings() ' auto-generated!
    InitializeLogging()
    m.log = log_Logger("MainScene")
    m.__le = m.log.enabled
    ' At this point, the "MainScene" node is not yet added to the scene, and does not have a parent yet.
    ' Let's wait until it has one.
    m.scene = m.top.getScene()
    m.MainSceneContainer = m.scene.findNode("MainSceneContainer")
    m.MainSceneContainer.ObserveField("change", "MainSceneContainerChanged")
end function

function MainSceneContainerChanged()
    AutoBindSceneGraph()
    LaunchArgumentsReceived()
    m.scene.ObserveField("inputArgs", "InputArgumentsReceived")
    if m.scene.inputArgs <> invalid
        InputArgumentsReceived()
    end if
    HideLoadingScreen()
end function

function LaunchArgumentsReceived() as void
    scene = m.top.getScene()
    launchArgs = scene.launchArgs
    m.log.info("file" + ":///Users/brahim/Roku/playlet/playlet-lib/src/components/MainScene.bs:31", "LaunchArgumentsReceived", launchArgs)
end function

function InputArgumentsReceived() as void
    scene = m.top.getScene()
    inputArgs = scene.inputArgs
    m.log.info("file" + ":///Users/brahim/Roku/playlet/playlet-lib/src/components/MainScene.bs:37", "InputArgumentsReceived", inputArgs)
end function'//# sourceMappingURL=./MainScene.bs.map