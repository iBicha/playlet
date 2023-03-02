# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- SponsorBlock notification
- Invidious username to web app v1

### Fixed
- Crash in case GetLocalIpAddress() returns invalid
- Use Format Stream (720p) instead of DASH (https://github.com/iv-org/invidious/issues/3666)

## [0.7.0] - 2023-02-04
### Added
- A script to sync between Youtube profile and and Invidious profile
- Moved most of Playlet logic to Playlet Lib
- Support for multiple caption languages

#### Fixed
- Issue where auto-play keeps playing the same videos in a loop

## [0.6.0] - 2023-01-10
### Added
- Ability to clear search history from web app
- WebSocket server for realtime events
- SponsorBlock tracking
- Auto-generated tasks and the @asynctask annotation
- Show known video metadata while loading video details
- Caching for video details

### Changed
- The License has changed from MIT to AGPL
- Now videos play the next related/recommended video once finished
  - This does not take into account the videos in playlists

### Fixed
- Bug where app freezes if metadata fails to fetch
- Bug where SponsorBlock returning videoDuration of zero causes the app to hang
- Bug where app would lose focus when casting from web app
- Bug where DASH stream is not compatible. Play format stream as a fallback
- Showing upcoming videos correctly

### Removed
- Dependency on [roku-promise](https://github.com/rokucommunity/roku-promise)

## [0.5.0] - 2022-12-02
### Added
- Version check in settings page
- Support for web request body parsing
- Error dialog for video load fail
- SponsorBlock sections and category info
- Loading spinner
- Picture in picture support
- [Deep linking support](https://developer.roku.com/en-ca/docs/developer-program/discovery/implementing-deep-linking.md)
  - Both Launch arguments and Input arguments are supported, using the "contentId" key as the Youtube video id
- Error and Exit dialogs

### Fixed
- Bug where playing and exiting a video too quickly would cause the video to play in the background.
- Bug where logging in causes issues if a video is already playing
- Bug where casting from web app while playing a video from the search
- Spinner for the video
- Bug where search sugggestions selected index is higher than total count
- Race condition where button group gains focus before suggestions are set in Search Page

## [0.4.0] - 2022-11-24
### Added
- Play video API
- Play video by ID/URL in web app
- Metadata to Video Player
- Support for DASH and Live videos
- Log out button to web app
- Search Screen
- Very basic UI to customize/change invidious instance

### Fixed
- Bug where Settings page and home page are both visible, if settings page is selected, and user logs in.

## [0.3.0] - 2022-11-19
### Changed
- App name! new name: **Playlet**

### Added
- Nav bar / menu
- Web server now always on
- Settings page with QR Code
- API Refactor
- New UI

## [0.2.0] - 2022-11-06
### Added
- QrCode component to take user to invidious token page
- Web server allowing the recption of the token through call back
  - The web server can also be used to serve a web app, facilitating the
    configuration of the Roku app, as well as controlling the app itself
- `auth/feed`, to read the subscriptions of the current user
- Video information (Author, view count, release date)
- Trending categories, subscription view, and custom (hardcoded) search categories
- User Playlist support
- Added basic instructions

## [0.1.0] - 2022-10-30
### Added
- Initial version
- Reads feeds from popular and trending videos using Invidious APIs
- Skips sections using SponsorBlock
