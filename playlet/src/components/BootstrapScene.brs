function Init() as void
    m.top.backgroundColor = "0x242424FF"
    m.top.backgroundURI = ""

    m.lib = m.top.FindNode("PlayletLib")

    if IsDebugMode()
        uri = "http://<DEBUG_HOST_IP_ADDRESS>:8080/playlet-lib.zip"
    else
        uri = GetPlayletLibProductionUrl()
    end if

    ?"Loading Playlet lib from " uri
    m.lib.observeField("loadStatus", "OnLoadStatusChanged")
    m.lib.uri = uri
end function

function OnLoadStatusChanged() as void
    if m.lib.loadStatus = "ready"
        m.top.getScene().createChild("PlayletLib:MainScene")
    end if
end function

function GetPlayletLibProductionUrl() as string
    appInfo = CreateObject("roAppInfo")
    return appInfo.GetValue("playlet_lib_prod_url")
end function
