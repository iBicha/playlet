import "pkg:/source/services/Invidious.bs"

sub Init()
    ' set the name of the function in the Task node component to be executed when the state field changes to RUN
    ' in our case this method executed after the following cmd: m.contentTask.control = "run"(see Init method in MainScene)
    m.top.functionName = "GetContent"
end sub

sub GetContent()
    rootChildren = []

    trendingJson = RokuYoutube.Services.Invidious.GetTrending()
    trending = GetCategoryContent("Trending", trendingJson)
    if trending <> invalid
        rootChildren.Push(trending)
    end if

    popularJson = RokuYoutube.Services.Invidious.GetPopular()
    popular = GetCategoryContent("Popular", popularJson)
    if popular <> invalid
        rootChildren.Push(popular)
    end if

    ' set up a root ContentNode to represent rowList on the GridScreen
    contentNode = CreateObject("roSGNode", "ContentNode")
    contentNode.Update({
        children: rootChildren
    }, true)
    ' populate content field with root content node.
    ' Observer(see OnMainContentLoaded in MainScene.brs) is invoked at that moment
    m.top.content = contentNode
end sub

function GetCategoryContent(category as string, json as object) as object
    if json <> invalid
        row = {}
        row.title = category
        row.children = []
        for each item in json ' parse items and push them to row
            itemData = GetItemData(item)
            row.children.Push(itemData)
        end for
        return row
    end if
end function

function GetItemData(video as object) as object
    item = {}

    item.title = video.title
    item.description = video.description
    item.hdPosterURL = video.videoThumbnails[0].url
    item.releaseDate = video.publishedText
    item.id = video.videoId
    item.length = video.lengthSeconds
    return item
end function
