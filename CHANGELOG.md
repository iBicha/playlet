# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Support to pause/play while picture-in-picture

### Fixed

- (potentionally) a bug where many dialogs could cause an execution timeout
- Mutltiple rare crashes when component content is set before component initialization

## [0.13.0] - 2023-10-02

### Added

- Playlists, streams, podcasts and related channels to Channel UI
  - Pagination supported
- Channels show up in web app (but no UI for channel details yet)
- Support for `Etag` header on the web server to improve performance with caching

### Fixed

- Another bug where the app crashes if an error happens loading channel info
- Issue with default instance (by changing default instance)
- Cropped text in a couple of buttons

### Removed

- Partial content (`Range` header) from the web server, since we never serve very big files

## [0.12.1] - 2023-09-19

### Added

- New logger: less features, and less rendezvous

### Fixed

- A bug where the app crashes if an error happens loading channel info

### Removed

- `roku-log` package
- `ropm`

## [0.12.0] - 2023-09-17

### Added

- A field to indicate when a playlist was last updated
- Voice search in search page
- Basic support for channels (open channel, see latest videos)
- Search filters (Upload date, type, duration, features, and sort by)

### Changed

- Renamed `Unstable` releases to `Canary`

## [0.11.0] - 2023-09-10

This version went through a major refactor, which resulted in a different arcitecture of the app to support new features, the rewrite of many pieces, as well as new features.

### Added

- The concept of a `Queue`. Videos can now be queued to play one after another.
  - Currently the queue is funcitonal, but no proper UI to support it, such as seeing the queue, clearing it, and so on.
  - UI for the `Queue` will be introduced in a future version.
  - Videos and playlists can be queued from the web app
- Support for Playlists
  - Home screen now shows both created and saved playlists
  - Playlists have their own view to scroll through their videos
  - Playlist videos play one after the other
  - Playlists show up in search results
- Continious scrolling of feed where supported (pagination)
  - Subscriptions, Search, Playlists and Search based feeds (like `Funny` and `News` in the home screen)
  - Not yet supported in the web app
- Home screen placeholder items while items are loading
- Settings screen has been rewritten with a better design
- Access to public instances
  - New UI to list public instances, or to specify a custom instance
  - Testing system to make sure the instance is properly setup and usable
- Playlet now tolerate certain missing configurations in Invidious (such as not configuring the domain)
- Better error handling, error dialogs, with more information on what went wrong
- Multiple Brighterscript plugins to support different functionalities of the app
- Testing framework, and some tests
- Performance imporvements
  - Lazy loading where applicable
  - Screens do not load until opened for the first time
  - Not all feeds are loaded at once, feeds are loaded on demand while scrolling
  - App profiled, some bottlenecks identified and fixed
  - QR Code generation happens on background thread
- More consistent logging, and the ability to retreive a log file of current run and the previous run
- New `HttpClient` for making web requests, which supports `SendAndForget` and Cancellation, with a reduced `rendezvous`
- Open API spec file describing available APIs in the Playlet Web Server

### Changed

- Lots of refactors and rewrites in general
- The developer settings are now always visible in the web app
- The web server is now decoupled from Playlet specific logic
- When not logged in, authenticated feed (like user Subscriptions and Playlists) show a "Login to view X" message, with a QR Code that redirects to the login screen
- [Breaking change] web apis changed a bit (for example the `/api/command` endpoint is removed) refer to the [Open API spec](docs/playlet-web-api.yml)
- If the Invidious auth token is missing permissions (A token aquired using a previous version of Playlet) you will be auto logged out.

### Removed

- `roku-requests` package. A new HttpClient has been written to fit the need of Playlet instead. Some of the reasons to do this:
  - It was causing a lot of `rendezvous`
  - It has no real way to send a request without waiting for it to finish (send and forget)
  - Some of the API was quirky (need to specify `parseJson: false` to ask it NOT to parse the response)
  - It reads the response data, headers, error codes and etc even if they are not needed
  - Excessive logging without a way to toggle it, or redirect it to a file
- Some unused parts of the code (Like basic auth in the server, WebSockets, RegistryRouter, Kanji QR Code)
  - These were unsued and/or feature flagged features. Things can be restored as needed.
- The video player loading spinner when the video is minimized: this added too much hacky code with minimum value.

### Fixed

- Different issues caused by background tasks in the home screen
- An issue caused by manipulating the loading spinner on the video player
- An issue where the web server hangs if the payload contains unicode characters

## [0.10.3] - 2023-07-24

### Added

- Support for saved playlists. By adding a playlist from a youtube channel to your Invidious profile, you can see the playlist on Playlet.

## [0.10.2] - 2023-07-10

### Added

- Links to the app info in web app
- Loading indicator for search page in web app
- Feedback link through email
- Scopes and expire fields to the Invidious auth token. This is to detect when a token is close to expiry, or if we have missing permissions.

### Fixed

- Video duration formatting in cast dialog
- (Removed) Workaround for Invidious token expiring due to misconfigured instance
- Crash when loading the home screen [#83](https://github.com/iBicha/playlet/issues/83)
- Performance of home screen in web app
- SponsorBlock segments where video duration is not provided (follow up to [#23](https://github.com/iBicha/playlet/pull/23))
- Focus with the settings input field

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
