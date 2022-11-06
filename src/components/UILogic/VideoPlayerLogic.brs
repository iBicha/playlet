import "pkg:/source/services/Invidious.bs"

sub ShowVideoScreen(videoMetadata as object, videoSponsorBlock as object)
    m.videoPlayer = CreateObject("roSGNode", "Video")
    rowNode = CreateObject("roSGNode", "ContentNode")

    rowNode.url = videoMetadata.formatStreams[videoMetadata.formatStreams.Count() - 1].url
    SetCaptions(videoMetadata, m.videoPlayer, rowNode)
    m.videoPlayer.content = rowNode

    ShowScreen(m.videoPlayer)
    m.videoPlayer.control = "play"
    m.videoPlayer.ObserveField("state", "OnVideoPlayerStateChange")
    m.videoPlayer.ObserveField("visible", "OnVideoVisibleChange")

    if videoSponsorBlock <> invalid
        newFields = {}
        newFields["sponsorblock"] = videoSponsorBlock
        m.videoPlayer.addFields(newFields)
        m.videoPlayer.seekMode = "accurate"
        m.videoPlayer.ObserveField("position", "OnVideoPositionChange")
    end if

end sub

sub SetCaptions(videoMetadata as object, videoPlayer as object, contentNode as object)
    ' TODO: check if we have caption settings ON
    ' TODO: read favorate language from system settings
    ' TODO: populate list of caption tracks
    if videoMetadata.captions.Count() = 0
        return
    end if
    videoPlayer.globalCaptionMode = "ON"
    contentNode.ClosedCaptions = True
    selectedCaption = videoMetadata.captions[0]

    ' Use favorite caption langauage, or the first one
    for each caption in videoMetadata.captions
        if caption.language_code = "en"
            selectedCaption = caption
            exit for
        end if
    end for

    contentNode.SubtitleConfig = {
        ShowSubtitle: 1,
        TrackName: RokuYoutube.Services.Invidious.GetCurrentHost() + selectedCaption.url
    }
end sub

sub OnVideoPlayerStateChange()
    state = m.videoPlayer.state

    ' A hack to see if we could use the proxy here
    if state = "error"
        errorInfo = m.videoPlayer.errorInfo
        if errorInfo.category = "http"
            url = m.videoPlayer.content.url
            if url.InStr("local=true") = -1
                print(`Video ${url} failed to play. Trying a proxy (local=true)`)
                m.videoPlayer.content.url = url + "&local=true"
                ' This video errored, and is about to finish, so don't close the video yet
                ' TODO: perhaps creating a second player is better?
                m.ignoreNextFinishedState = true
                m.videoPlayer.control = "play"
                return
            end if
        end if
    end if

    if state = "finished" and m.ignoreNextFinishedState = true
        m.ignoreNextFinishedState = false
        return
    end if

    if state = "error" or state = "finished"
        CloseScreen(m.videoPlayer)
    end if
end sub

sub OnVideoVisibleChange()
    if m.videoPlayer.visible = false and m.top.visible = true
        m.videoPlayer.control = "stop"

        m.videoPlayer.content = invalid
        screen = GetCurrentScreen()
        screen.SetFocus(true)
    end if
end sub

sub OnVideoPositionChange()
    SkipSponsorBlockSections()
end sub

sub SkipSponsorBlockSections()
    segments = m.videoPlayer.getField("sponsorblock")
    for each segment in segments
        if segment["actionType"] = "skip"
            segmentRange = segment["segment"]
            segmentStart = segmentRange[0]
            segmentEnd = segmentRange[1]
            currentPosition = m.videoPlayer.position
            if (segmentStart < currentPosition) and ((segmentEnd - 1) > currentPosition)
                ' TODO: if segmentEnd is at the end of the video, close video
                m.videoPlayer.seek = segmentEnd
                print("Skiping section:" + segment["category"])
                return
            end if
        end if
    end for
end sub