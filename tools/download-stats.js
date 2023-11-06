const fs = require('fs')

const markdownFile = "./playlet.wiki/Home.md"

const markdownContent = `
# Playlet stats
This page was automatically generated on ${new Date().toUTCString()}.

## Channel Health

![Channel Health](Channel_Health.png)

## Channel Engagement

![Channel Engagement](Channel_Engagement.png)

## Viewership Summary

![Viewership Summary](Viewership_Summary.png)
`

fs.writeFileSync(markdownFile, markdownContent)