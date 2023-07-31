'import "pkg:/components/AutoBind/AutoBind.bs"
'import "pkg:/source/utils/LoadingScreen.bs"

function Init()
    InitializeBindings() ' auto-generated!
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
    ? "LaunchArgumentsReceived " launchArgs
end function

function InputArgumentsReceived() as void
    scene = m.top.getScene()
    inputArgs = scene.inputArgs
    ? "InputArgumentsReceived " inputArgs
end function'//# sourceMappingURL=./MainScene.bs.map