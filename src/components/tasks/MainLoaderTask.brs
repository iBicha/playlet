import "pkg:/source/services/Invidious.bs"

sub Init()
    ' set the name of the function in the Task node component to be executed when the state field changes to RUN
    ' in our case this method executed after the following cmd: m.contentTask.control = "run"(see Init method in MainScene)
    m.top.functionName = "GetContent"
end sub

sub GetContent()
    rootChildren = []

    trendingTypes = [invalid, "Music", "Gaming", "Movies"]
    for each trendingType in trendingTypes
        trendingJson = RokuYoutube.Services.Invidious.GetTrending(trendingType)
        title = trendingType <> invalid ? `Trending - ${trendingType}` : "Trending"
        trending = GetCategoryContent(title, trendingJson)
        if trending <> invalid
            rootChildren.Push(trending)
        end if
    end for

    popularJson = RokuYoutube.Services.Invidious.GetPopular()
    popular = GetCategoryContent("Popular", popularJson)
    if popular <> invalid
        rootChildren.Push(popular)
    end if

    feedJson = RokuYoutube.Services.Invidious.GetUserFeed()
    feed = GetCategoryContent("Subscriptions", feedJson)
    if feed <> invalid
        rootChildren.Push(feed)
    end if

    keywords = ["Funny Animals", "News"]
    for each keyword in keywords
        json = RokuYoutube.Services.Invidious.Search(keyword, invalid, RokuYoutube.Models.Invidious.SearchFilter.SortBy.UploadDate)
        data = GetCategoryContent(keyword, json)
        if data <> invalid
            rootChildren.Push(data)
        end if
    end for

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
    if json <> invalid and json.Count() > 0
        row = {}
        row.title = category
        row.children = []
        for each item in json ' parse items and push them to row
            itemData = GetItemData(item)
            if itemData <> invalid
                row.children.Push(itemData)
            end if
        end for
        return row
    end if
end function

function GetItemData(video as object) as object
    ' TODO: handle playlists and channels
    if video.videoId = invalid
        return invalid
    end if
    item = {}

    item.title = video.title
    item.description = video.description
    item.hdPosterURL = video.videoThumbnails[0].url
    item.releaseDate = video.publishedText
    item.id = video.videoId
    item.length = video.lengthSeconds
    item.author = video.author
    item.viewCount = video.viewCount
    return item
end function
