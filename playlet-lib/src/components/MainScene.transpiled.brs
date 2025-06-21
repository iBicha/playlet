'import "pkg:/components/Dialog/DialogUtils.bs"
'import "pkg:/components/EcpArgs.bs"
'import "pkg:/components/parts/AutoBind/AutoBind.part.bs"
'import "pkg:/components/parts/AutoBind/OnNodeReadyNoOp.bs"
'import "pkg:/source/utils/LoadingScreen.bs"
'import "pkg:/source/utils/Locale.bs"

function Init()
    InitializeBindings() ' auto-generated!
    m.scene = m.top.getScene()
    SetScenePalette(m.scene)
    ' At this point, the "MainScene" node is not yet added to the scene, and does not have a parent yet.
    ' Let's wait until it has one.
    m.MainSceneContainer = m.scene.findNode("MainSceneContainer")
    m.MainSceneContainer.ObserveField("change", FuncName(MainSceneContainerChanged))
end function

function SetScenePalette(scene as object) as void
    palette = scene.palette
    if palette <> invalid
        return
    end if
    palette = CreateObject("roSGNode", "RSGPalette")
    palette.colors = {
        DialogBackgroundColor: "#242424FF"
        DialogFocusColor: "#CECECEFF"
        DialogFocusItemColor: "#202020FF"
        DialogSecondaryTextColor: "#EBEBEBFF"
        DialogSecondaryItemColor: "#FF1C30FF"
        DialogTextColor: "#EBEBEBFF"
    }
    scene.palette = palette
end function


function MainSceneContainerChanged()
    AutoBindSceneGraph()
    StartWebServer()
    HideLoadingScreen()
    InitEcpArgs()
    if true
        if not ShowAnnouncement()
            m.scene.signalBeacon("AppLaunchComplete")
        end if
    else
        m.scene.signalBeacon("AppLaunchComplete")
    end if
    CopyLoadingMessagesToCache()
end function

function StartWebServer()
    m.loungeService = m.top.findNode("LoungeService")
    m.loungeService.callfunc("StartService", invalid)
    m.webServer = m.top.findNode("WebServer")
    m.webServer.callfunc("StartServer", invalid)
    m.dialServer = m.top.findNode("DialServer")
    m.dialServer.callfunc("StartServer", invalid)
end function

function ShowAnnouncement() as boolean
    deviceInfo = CreateObject("roDeviceInfo")
    deviceName = deviceInfo.GetFriendlyName()
    dialog = DialogUtils_ShowDialogOnce({
        messageId: "1750501488"
        title: "Web app workaround"
        message: [
            "If you're experiencing issues playing videos, please consider this workaround while we work on a fix:"
        ]
        bulletText: [
            "Go to the " + chr(34) + "Remote" + chr(34) + " screen, and scan the QR code to open the web app in your browser."
            "Tap the video you want to play."
            ("Select the " + chr(34) + "Play on " + bslib_toString(deviceName) + " (ytjs)" + chr(34) + " button.")
        ]
        bottomMessage: [
            "Apologies for the inconvenience, and thank you for your patience!"
            "Issue link: https://github.com/iBicha/playlet/issues/626"
        ]
        alwaysOnTop: true
        large: true
    })
    if dialog = invalid
        return false
    end if
    m.scene.signalBeacon("AppDialogInitiate")
    dialog.observeField("wasClosed", FuncName(OnAnnouncementDialogClosed))
    return true
end function

function OnAnnouncementDialogClosed()
    m.scene.signalBeacon("AppDialogComplete")
    m.scene.signalBeacon("AppLaunchComplete")
end function
'//# sourceMappingURL=./MainScene.brs.map