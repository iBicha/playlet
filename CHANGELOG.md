# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Nothing worth mentioning yet.

## [0.25.2] - 2024-08-05

### Added

- An announcement for the `This helps protect our community` error message

### Fixed

- Few optimizations with texture loading to improve memory usage
- A rare crash in DIAL server

## [0.25.1] - 2024-08-03

### Added

- Partial Spanish translations (Thanks to gallegonovato)

### Fixed

- Issue with focus in the video queue view

## [0.25.0] - 2024-07-22

### Added

- Sort options to channel live streams
- Video width and height to DASH manifest

## [0.24.6] - 2024-07-08

### Fixed

- A bug where the right video will not play if selected too quickly
- A bug where a bookmarked but deleted playlist can't be removed from bookmarks

## [0.24.5] - 2024-07-03

### Added

- Additional Spanish (Mexico) translations (Thanks to Jean Carton)

## [0.24.4] - 2024-06-24

### Added

- Additional Spanish (Mexico) translations (Thanks to Jean Carton)
- Partial Portuguese (Brazil) translations (Thanks to Bruno Fernandes)

## [0.24.3] - 2024-06-20

### Added

- Additional Spanish (Mexico) translations (Thanks to Jean Carton)

## [0.24.2] - 2024-06-16

### Added

- Partial Spanish (Mexico) translations (Thanks to Jean Carton)

### Fixed

- An issue where pause/play would not work with picture-in-picture on certain views

## [0.24.1] - 2024-06-09

### Added

- A link to [https://github.com/iBicha/playlet/issues/400](https://github.com/iBicha/playlet/issues/400) in error dialog

## [0.24.0] - 2024-06-08

### Added

- Low memory warnings to the app logs for easier memory issue debugging
- German translations (Thanks to Lacey Anaya)
- Sliding navbar (primarily to support German as it has longer words for the menu screens)

### Changed

- Some UI refactors to support the different languages (English, French, German)

## [0.23.7] - 2024-05-28

### Added

- A clock to show the time

### Fixed

- Attempt to fix a race condition when closing player

## [0.23.6] - 2024-05-23

### Added

- A dev setting to clear the cache

### Fixed

- A bug where bookmarked channels can be duplicated
- A bug where video cast from web app would not play if there's an error dialog on screen
- failed to create media player error, by waiting for previous video to stop before starting a new one

### Changed

- Font weight to be less bold

## [0.23.5] - 2024-05-19

### Fixed

- a bug where trending and search wouldn't work in certain countries (web app)
- A crash when lounge session is lost and fails to recover
- A bug where live videos to not start at the "edge" of the stream

## [0.23.4] - 2024-05-04

### Added

- An invidious instance "fetch with CORS" test

### Fixed

- a bug where public Invidious instances all showed `N/A` in the health column
- a bug where trending and search wouldn't work in certain countries

## [0.23.3] - 2024-04-28

### Changed

- Removed announcement - most public instances are now updated

## [0.23.2] - 2024-04-27

### Changed

- Updated announcement

## [0.23.1] - 2024-04-24

### Added

- Announcement dialog to indicate outage

## [0.23.0] - 2024-04-04

### Added

- Loading Playlet lib as squashfs, with fallback to the zip file. This significantly decreases load times.

### Changed

- Bumped minimum OS version to 11, this is required for squashfs-zstd

## [0.22.3] - 2024-03-31

### Changed

- Removed announcement

## [0.22.2] - 2024-03-31

### Changed

- Updated announcement

## [0.22.1] - 2024-03-30

### Added

- Announcement dialog to indicate outage

### Fixed

- [Attempt] A bug where the lounge would randomly lose the session id, making it unable to cast, and spam the same error over and over
- Dialog with timer now stops as expected if any button is pressed

## [0.22.0] - 2024-03-24

### Added

- Context menu sort options for channel videos and playlists
- Localization support and French translations
- Channel releases

### Changed

- Colors to be more broadcast safe

### Fixed

- A bug where instance testing is not immediately cancelled when the testing page is closed
- A bug in the web app where "upcoming" videos show up as "live"
- Search sort filters

## [0.21.2] - 2024-03-10

### Fixed

- Deeplinking required for certification

## [0.21.1] - 2024-03-09

### Added

- Subscriber count in the channel page

### Fixed

- A bug where videos that did not premiere yet would error with a playback error
- A bug where a playback error dialog is dismissed too fast before playing the next video

## [0.21.0] - 2024-03-07

### Added

- Support for multiple profiles. You can now use multiple Invidious accounts.
- When a video error dialog shows, a timer with 10 seconds starts to play the next video

### Fixed

- A bug where the loading screen does not disappear if search results are empty.
- Empty invidious instance in preferences when default instance is being used

## [0.20.2] - 2024-02-26

### Added

- Small improvement in the context menu of the Playlist view
- Videos can be paused and resumed using the `OK` remote button

### Fixed

- `Device connected` notification only show once every 30 minutes per device to avoid spam
- SponsorBlock category "highlight" was not visible in chapter label

### Changed

- UI focus images are now with rounded corners, and with a slight glow

## [0.20.1] - 2024-02-23

### Fixed

- `Device connected` notification showing repeatedly

## [0.20.0] - 2024-02-21

### Added

- Support for casting from the YouTube app (also known as Lounge API, or LeanBack)
  - Connect to Playlet from the YouTube mobile app or from certain browsers (such as Chrome)
  - Connect to Playlet from local network, or through the TV code.
  - On the cast dialog in your YouTube mobile app, you might see two listings for the same device. E.g. `Roku TV` and `Playlet on Roku TV`. Use the `Playlet on` one to cast to Playlet, and the other one to cast to the regular YouTube TV app.
  - The functionality is still experiemntal, and has some limitations. To name a few:
    - The queue does not perfectly sync between the mobile app and Playlet, espeically if it gets modified by the web app or in Playlet.
    - Many functions (such as d-pad controls or setting the volume) are not working due to OS limitations
    - Many functions (such as changing the subtitle settings) are not currently implemented
  - **ATTENTION**: This feature is not very privacy friendly. When connected to a lounge, all network traffic (videos played, queued, etc) go through YouTube servers. For this reason, certain measures are taken:
    - While Playlet broadcasts its casting capabilities to the local network, it does not connect to a lounge for the first time until:
      - A device connects to Playlet (using DIAL/Connect using Wi-Fi)
      - A `Link with TV code` is generated, by visiting the `Remote` -> `Link with TV code` tab.
    - Playlet disconnects from previous lounge sessions on start, and joins a new one instead of one continous session. In other words, restarting Playlet will disconnect your second device. This is a feature, not a bug.
    - Playlet does not expose device details, and uses a randomly generated id on each start, instead of consistent device id.

### Changed

- The queue no longer contains playlists. When a playlist is added to the queue, the entire playlist is loaded.
  - It can take a few seconds to load large playlist before it can be added to the queue
  - This is done to be more compatible more the lounge, which does not contain "Playlists in the queue" concept.
- The `Web App` tab is now called `Remote`. It can be used to open the web app, or connect using Lounge (cast from YouTube)
- Removed `fields` from Invidious requests, as per [https://github.com/iv-org/invidious/pull/4276](https://github.com/iv-org/invidious/pull/4276)
- The `POST /api/queue/` no longer returns the current queue. Instead it returns a 204.

### Fixed

- [Perf] improved some caching of videos in the queue

## [0.19.2] - 2024-02-11

### Fixed

- [Attempt #2] to fix a crash caused by execution timeout when stopping a video takes too long
- Wrong hint on the "added to queue" notification when in fullscreen
- A rare crash when listing Invidious public instances
- Restoring video to full screen not working when on certain screens

## [0.19.1] - 2024-01-13

### Added

- A hint on how to restore video to full screen

### Changed

- Bookmarks are now added to the top of the list
- The search screen keyboard to make it easier to clear the search field

### Fixed

- A bug with request retry mechanism introduced in 0.19.0

## [0.19.0] - 2024-01-10

### Added

- A home screen editor allowing to enable/disable feeds, and change their order.
  - The editor can be accessed from the Settings screen.

### Fixed

- `HTTP/0.9 when not allowed` errors by adding a retry to web requests
- Issue where a bookmarked video is no longer valid (such as a video made private, or a live stream that ended)
- [Perf] App loads slightly faster (~500ms)

## [0.18.1] - 2024-01-02

### Fixed

- A rare bug that causes the app to crash when displaying video cells
- A rare bug where a long press can cause a crash
- [Attempt] to fix a crash caused by execution timeout when stopping a video takes too long
- Unsupported subtitles (subtitles that can't be rendered will not be used)

### Removed

- `Funny` and `News` from the Home screen.
  - These are not standard feeds (like `Trending`), and are just search results for `Funny` and `News`. They were added in earlier Playlet versions to have more content in the Home screen.
  - If you like to add these two feeds to your bookmarks:
    - Search for `Funny` (or `News`)
    - Set the `Sort by` filter to `Upload date`
    - Press and hold the `OK` button while a video from the search result is selected
    - Choose the `Add to "Search - Funny"` option

## [0.18.0] - 2023-12-28

### Added

- Medium video quality in the settings (For most videos, this is 360p)
- Invidious watch history feed

### Fixed

- (Regression) Issue where auto-play keeps playing the same videos in a loop
- Small search box styling bug for Safari
- A bug where the skipping of a sponsored section at the end of a video leads to an infinite loop
- A couple of bugs when listing Invidious public instances

### Removed

- Xmas theme logo - can't publish it before end of year... ([link](https://blog.roku.com/developer/channel-store-blackouts-2023))

## [0.17.3] - 2023-12-13

### Added

- Xmas theme logo

## [0.17.2] - 2023-12-10

### Added

- Loading message

## [0.17.1] - 2023-12-08

### Added

- An instance test to make sure thumbnails are reachable

### Fixed

- A rare error when video player is closed but does not have valid content
- A rare error that can occur with loading indicators causing a crash

## [0.17.0] - 2023-11-17

### Added

- Playlet logo in web app is clickable, and launches app if not already on
- Remote control in web app
  - Clickable buttons and keyboard support

## [0.16.0] - 2023-11-13

### Added

- User interface for the Queue: Press and hold `Options (*)` to show the queue

### Fixed

- Crash when video player has no content
- Execution timeout on cirlce posters

## [0.15.1] - 2023-11-10

### Added

- An option to disable search history

### Fixed

- A rare bug that causes the app to crash when displaying video cells
- A bug where we show error dialogs that happened on screens that are already closed
- A bug where bookmarks show duplicate videos
- A bug where watch history is not always sent to Invidious

## [0.15.0] - 2023-11-05

### Added

- Pagination support in web app search (load more button)
- Video links pasted into the web app triggers the dialog to cast the video
- Ability to subscribe/unsubscribe from a channel screen
  - This needs additional scope for the Invidious token. You will be logged out, and need to login again. Sorry for the inconvenience.
- A notification when videos are added to the queue (can be disabled from the settings)

### Fixed

- A bug where casting from web included timestamp even if the "Start at" check box is unchecked
- A leak where channel screens would reload data even when closed
- A crash when fetching subscriptions
- Fetching errors by adding a retry mechanism to web requests

## [0.14.0] - 2023-10-25

### Added

- Bookmarks: different items can now be bookmarked, and be found in the `Bookmarks` screen.
  Things that can be bookmarked:
  - A video
  - A channel
  - A playlist
  - Subscriptions
  - Trending
  - Popular
  - Playlists
  - Search results
  - Channel tabs (latest videos, live streams, playlists, shorts, podcasts, related channels)
- Context menu: press and hold `OK` to show a context menu to:
  - Play/queue a video or a playlist
  - Open the channel of a playlist or of a video
  - Manage bookmarks
- Local DASH manifest generation
  - This adds support for multi languages audio tracks
  - Also adds thumbnails/preview in trick play mode
    - Known issue: thumbnails might appear cropped/misaligned at the end of videos. This will be addressed in a later release.
- Search filters in web app
- Channels and Playlists can be opened on TV from web app
- Channel links can be drag and dropped into the web app

### Fixed

- Layout in channel view so that the upload time and view count of videos is visible
- A few things in the logger
- A bug where channels show "0 videos". Channel handle is shown instead.

### Changed

- Cache format so it does less parsing work
- Removed "chapter" from SponsorBlock categories

## [0.13.1] - 2023-10-08

### Added

- Support to pause/play while picture-in-picture

### Fixed

- (potentionally) a bug where many dialogs could cause an execution timeout
- Mutltiple rare crashes when component content is set before component initialization
- Error dialog for loading "Popular" when "Popular" is disabled

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
  - These were unused and/or feature flagged features. Things can be restored as needed.
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
  - Improved drag and drop functionality (drag and drop a link from YouTube into the web app)
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

- A script to sync between YouTube profile and and Invidious profile
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
  - Both Launch arguments and Input arguments are supported, using the "contentId" key as the YouTube video id
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
