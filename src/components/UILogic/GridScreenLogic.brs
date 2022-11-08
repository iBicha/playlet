function ShowGridScreen()
    m.GridScreen = CreateObject("roSGNode", "GridScreen")
    m.GridScreen.ObserveField("rowItemSelected", "OnGridScreenItemSelected")
    ShowScreen(m.GridScreen)
end function

function OnGridScreenItemSelected(event as object)
    grid = event.GetRoSGNode()

    selectedPair = event.GetData()
    selectedRow = selectedPair[0]
    selectedRowItem = selectedPair[1]

    rowContent = grid.content.GetChild(selectedRow)
    itemContent = rowContent.GetChild(selectedRowItem)

    videoId = itemContent.id

    RunVideoDetailsTask(videoId)
end function
