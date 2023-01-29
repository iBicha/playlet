' Based on https://github.com/jellyfin/jellyfin-roku/blob/unstable/components/IconButton.brs
function init()
    m.buttonBackground = m.top.findNode("buttonBackground")
    m.buttonIcon = m.top.findNode("buttonIcon")
    m.buttonText = m.top.findNode("buttonText")

    m.top.observeField("background", "onBackgroundChanged")
    m.top.observeField("icon", "onIconChanged")
    m.top.observeField("text", "onTextChanged")
    m.top.observeField("height", "onHeightChanged")
    m.top.observeField("width", "onWidthChanged")
    m.top.observeField("padding", "onPaddingChanged")
    m.top.observeField("focus", "onFocusChanged")
end function

function onFocusChanged()
    if m.top.focus
        m.buttonBackground.blendColor = m.top.focusBackground
    else
        m.buttonBackground.blendColor = m.top.background
    end if
    m.buttonBackground.visible = m.top.focus
    m.buttonText.visible = m.top.focus

end function

function onBackgroundChanged()
    m.buttonBackground.blendColor = m.top.background
    m.top.unobserveField("background")
end function

function onIconChanged()
    m.buttonIcon.uri = m.top.icon
end function

function onTextChanged()
    m.buttonText.text = m.top.text
end function

function setIconSize()
    height = m.buttonBackground.height
    width = m.buttonBackground.width
    if height > 0 and width > 0
        ' TODO: Use smallest number between them
        m.buttonIcon.height = m.top.height

        if m.top.padding > 0
            m.buttonIcon.height = m.buttonIcon.height - m.top.padding
        end if

        m.buttonIcon.width = m.buttonIcon.height

        m.buttonIcon.translation = [((width - m.buttonIcon.width) / 2), ((height - m.buttonIcon.height) / 2)]
        m.buttonText.translation = [0, height]
        m.buttonText.width = width
    end if
end function

function onHeightChanged()
    m.buttonBackground.height = m.top.height
    setIconSize()
end function

function onWidthChanged()
    m.buttonBackground.width = m.top.width
    setIconSize()
end function

function onPaddingChanged()
    setIconSize()
end function

function onKeyEvent(key as string, press as boolean) as boolean
    if not press
        return false
    end if
    if key = "right" and m.top.focus
        m.top.escape = "right"
    end if

    if key = "left" and m.top.focus
        m.top.escape = "left"
    end if

    return false
end function
