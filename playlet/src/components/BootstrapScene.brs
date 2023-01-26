function Init() as void
    m.top.backgroundColor = "0x242424FF"
    m.top.backgroundURI = ""

    m.lib = m.top.FindNode("PlayletLib")
    m.lib.uri = "http://192.168.1.182:8080/playlet-lib.zip"
    m.lib.observeField("loadStatus", "OnLoadStatusChanged")
end function

function OnLoadStatusChanged() as void
    if m.lib.loadStatus = "ready"
        m.top.getScene().createChild("PlayletLib:MainScene")
    end if
end function
