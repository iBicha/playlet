function Init() as void
    m.top.backgroundColor = "0x242424FF"
    m.top.backgroundURI = ""

    m.playletLibUrls = GetPlayletLibUrls()
    m.playletLibUrlIndex = 0

    LoadPlayletLib()
end function

function GetPlayletLibUrls() as object
    github = { type: "github", link: ReadManifestValue("playlet_lib_remote_url") }
    embedded = { type: "embedded", link: ReadManifestValue("playlet_lib_embedded_url") }
    registry = { type: "registry", link: ReadRegistryKey("playlet_lib_url", "Playlet") }

    if IsDebugMode()
        return [embedded]
    end if

    urls = []

    if registry.link <> invalid
        urls.Push(registry)
    end if

    urls.push(github)
    urls.push(embedded)

    return urls
end function

function LoadPlayletLib() as void
    if m.playletLibUrlIndex >= m.playletLibUrls.Count()
        ShowPlayletLibLoadErrorDialog()
        return
    end if

    m.lib = m.top.getScene().createChild("ComponentLibrary")
    m.lib.observeField("loadStatus", "OnLoadStatusChanged")

    uri = m.playletLibUrls[m.playletLibUrlIndex].link
    ?"Loading Playlet lib from " uri
    m.lib.uri = uri
end function

function OnLoadStatusChanged() as void
    uri = m.playletLibUrls[m.playletLibUrlIndex].link
    if m.lib.loadStatus = "ready"
        ?"Playlet lib loaded from " uri
        m.top.getScene().createChild("PlayletLib:MainScene")
        return
    end if

    if m.lib.loadStatus = "failed"
        ?"Playlet lib failed to load from " uri
        if m.playletLibUrls[m.playletLibUrlIndex].type = "registry"
            ' Delete library url from registry since it failed
            DeleteRegistryKey("playlet_lib_url", "Playlet")
        end if
        ' Try next url
        m.playletLibUrlIndex += 1
        LoadPlayletLib()
    end if
end function

function ShowPlayletLibLoadErrorDialog()
    message = [
        "Could not load Playlet component library from any of the following urls:",
    ]

    bulletText = []
    for each url in m.playletLibUrls
        bulletText.push("[" + url.type + "] " + url.link)
    end for

    bottomText = [
        "Please restart Playlet.",
        "If the problem persist, contact Playlet authors."
    ]

    ShowErrorDialog(message, bulletText, bottomText)
end function
