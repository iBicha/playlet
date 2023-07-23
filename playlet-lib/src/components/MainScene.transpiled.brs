'import "pkg:/components/AutoBind/AutoBind.bs"

function Init()
    InitializeBindings() ' auto-generated!
    LaunchArgumentsReceived()
    scene = m.top.getScene()
    scene.ObserveField("inputArgs", "InputArgumentsReceived")
    AutoBindSceneGraph()
    appController = m.top.findNode("AppController")
    ? "Root from main: ", appController.root
    ? "AppController from main: ", m.reference1.root
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