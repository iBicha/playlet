import "pkg:/source/services/SponsorBlock.bs"
import "pkg:/source/services/Invidious.bs"

sub Init()
    ' set the name of the function in the Task node component to be executed when the state field changes to RUN
    ' in our case this method executed after the following cmd: m.contentTask.control = "run"(see Init method in MainScene)
    m.top.functionName = "GetVideoContent"
end sub

sub GetVideoContent()
    metadata = GetVideoMetadata()
    sponsorBlock = GetVideoSponsorBlock()

    contentNode = CreateObject("roSGNode", "ContentNode")
    content = {}
    content["metadata"] = metadata
    content["sponsorblock"] = sponsorBlock

    contentNode.addFields(content)
    m.top.content = contentNode
end sub

function GetVideoMetadata()
    videoId = m.top.getField("videoid")

    videoMetadata = RokuYoutube.Services.Invidious.GetVideoMetadata(videoId)
    lastItag = videoMetadata.formatStreams[videoMetadata.formatStreams.Count() - 1].itag

    ' GetVideoUrl returns a url with the local=true, leading to less change of rate limit (403) - maybe?
    ' TODO: is this reliable?
    videoUrl = RokuYoutube.Services.Invidious.GetVideoUrl(videoId, lastItag)
    videoMetadata.formatStreams.push({
        itag: lastItag,
        url: videoUrl
    })

    return videoMetadata
end function

function GetVideoSponsorBlock()
    videoId = m.top.getField("videoid")

    return RokuYoutube.Services.SponsorBlock.GetSkipSegmentsForVideo(videoId)
end function