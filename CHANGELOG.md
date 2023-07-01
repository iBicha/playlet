# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- links to the app info in web app

### Fixed

- Video duration formatting in cast dialog

## [0.10.1] - 2023-06-28

### Added

- Support playing a video from a specific time (cast from phone, drag and drop, open in Invidious)

### Fixed

- A crash where the saved auth token is not in a valid format
- Video duration formatting for long videos
- A bug where app would lose focus when playing the next video (0.10.0 regression)

## [0.10.0] - 2023-06-25

### Added

- New web app, mirroring Playlet app
  - Includes home page, search, settings and info
  - Dark mode
  - Also includes a dev menu
    - Hidden by default, use `dev=1` in the browser to show it
  - Improved drag and drop functionality (drag and drop a link from Youtube into the web app)
- New settings page, available on TV and web app
- New preferences system
  - Unified settings between TV and web app
  - Web API allowing to import/export preferences (no UI for that yet)
- Added launch argument `clearPlayletLibUrls`
  - If the dev menu is used to load a custom Playlet lib url, but the lib does not have a functionality to revert back, `curl -d '' "http://$ROKU_DEV_TARGET:8060/launch/dev?clearPlayletLibUrls=true"` can be used to remove the custom lib, and revert to using default.

### Fixed

- Issue where a dialog remains on screen when a video was cast from web app

### Changed

- SponsorBlock segments are not skipped by default, except for sponsor segments
- Web app QR Code is now in its own page
- Roku OS 10.0 minimum is required

### Removed

- The ability to set multiple Invidious instances. This was anticipated to use as fallback in case of failure, but it was never implemented. This is now removed to avoid confusion
  - Sometimes it is necesary to check multiple instances for closed captions in case one instance is saturated. For this case, publicly hosted Invidious instances will be used. This feature is still behind a feature flag, and not on by default, because it might delay the start of videos.
  - Of course, if no instance if provided, a public instance will be used by default. This behaviour did not change and it is now implicit.

## [0.9.0] - 2023-04-21

### Added

- Add watched videos to Invidious watch history
- App info screen
- A dev menu selector to test newer or older versions of playlet lib
  - Makes it possible to test unstable releases before they officially release

### Fixed

- A crash where the metadata of a video is not validated [#57](https://github.com/iBicha/playlet/issues/57)
- A crash where the video details in home screen are null [#56](https://github.com/iBicha/playlet/issues/56)
- A crash where the video details are not returned in json [#63](https://github.com/iBicha/playlet/issues/63)
- Revert to using DASH instead of 720p by default
- A crash where request cache fails [#62](https://github.com/iBicha/playlet/issues/62)

## [0.8.0] - 2023-03-02

### Added

- SponsorBlock notification
- Invidious username to web app v1

### Fixed

- Crash in case GetLocalIpAddress() returns invalid
- Use Format Stream (720p) instead of DASH (<https://github.com/iv-org/invidious/issues/3666>)

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

<!-- markdownlint-configure-file {"MD024": { "siblings_only": true } } -->
