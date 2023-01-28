function ShowErrorDialog(message as object, bulletText as object, bottomMessage as object)
    dialog = CreateObject("roSGNode", "StandardMessageDialog")
    dialog.message = message
    dialog.bulletText = bulletText
    dialog.bottomMessage = bottomMessage
    dialog.title = "Error loading Playlet"
    dialog.buttons = ["Exit"]

    dialog.observeField("buttonSelected", "OnButtonSelected")
    dialog.observeField("wasClosed", "OnDialogClosed")

    m.top.getScene().dialog = dialog
end function

function OnButtonSelected()
    m.top.getScene().dialog.close = true
end function

function OnDialogClosed()
    scene = m.top.getScene()
    scene.playletLibMsg = {
        source: "playlet-lib",
        command: "exitChannel"
    }
end function
