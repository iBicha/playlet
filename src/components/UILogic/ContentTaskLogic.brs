function RunContentTask()
    m.contentTask = CreateObject("roSGNode", "MainLoaderTask")

    m.contentTask.ObserveField("content", "OnMainContentLoaded")
    m.contentTask.control = "run"
    m.loadingIndicator.visible = true
end function

function OnMainContentLoaded()
    m.GridScreen.SetFocus(true)
    m.loadingIndicator.visible = false
    m.GridScreen.content = m.contentTask.content
end function
