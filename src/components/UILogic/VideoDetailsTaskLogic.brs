sub RunVideoDetailsTask(videoId)
    m.videoDetailsTask = CreateObject("roSGNode", "VideoDetailsLoaderTask")
    m.videoDetailsTask.setField("videoid", videoId)
    m.videoDetailsTask.ObserveField("content", "OnVideoDetailsLoaded")
    m.videoDetailsTask.control = "run"
    m.loadingIndicator.visible = true ' show loading indicator while content is loading
end sub

sub OnVideoDetailsLoaded()
    m.loadingIndicator.visible = false
    if m.videoDetailsTask.content.metadata = invalid
        return
    end if
    ShowVideoScreen(m.videoDetailsTask.content.metadata, m.videoDetailsTask.content.sponsorblock)
end sub