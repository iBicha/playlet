# Playlet documentation

This document contains various kinds of information related to Playlet development. It's a bit of a [brain dump](https://en.wiktionary.org/wiki/brain_dump) that I tried to keep structured.

- [Environment setup](#environment-setup)
  - [Project setup](#project-setup)
  - [Roku Developer mode](#roku-developer-mode)
  - [Setting up Visual Studio Code](#setting-up-visual-studio-code)
- [Tools](#tools)
  - [BrightScript Language Extension for VS Code](#brightscript-language-extension-for-vs-code)
  - [RALE (Roku Advanced Layout Editor)](#rale-roku-advanced-layout-editor)
  - [BrighterScript](#brighterscript)
  - [BrighterScript Linter/Formatter](#brighterscript-linterformatter)
  - [BrighterScript Plugins](#brighterscript-plugins)
- [Playlet App](#playlet-app)
  - [Why separate between Playlet and Playlet Lib?](#why-separate-between-playlet-and-playlet-lib)
- [Playlet Lib](#playlet-lib)
  - [WebServer](#webserver)
    - [Debug endpoints](#debug-endpoints)
  - [Releases from Github](#releases-from-github)
  - [Dev library hosted by VS Code Extension](#dev-library-hosted-by-vs-code-extension)
  - [Feature flags](#feature-flags)
  - [User preferences](#user-preferences)
  - [Home page layout](#home-page-layout)
- [Testing](#testing)
- [Playlet Web App](#playlet-web-app)
  - [Svelte development](#svelte-development)
  - [Tailwind/Daisy UI](#tailwinddaisy-ui)
  - [API calls](#api-calls)
    - [API calls (proxy authenticated)](#api-calls-proxy-authenticated)
  - [Developer settings](#developer-settings)
    - [In case of a softlock](#in-case-of-a-softlock)
- [CI/CD](#cicd)

## Environment setup

### Project setup

```bash
git clone https://github.com/iBicha/playlet.git
cd playlet
npm install
```

### Roku Developer mode

To develop Roku applications, you need to enable Developer mode on your Roku device.
Using your Roku remote, enter the following sequence:

<!-- markdownlint-disable-next-line -->
<img src="https://image.roku.com/ZHZscHItMTc2/dev-startup1.png" alt="DevSequence" width="350"/>

For full instructions, see [Activating developer mode](https://developer.roku.com/en-ca/docs/developer-program/getting-started/developer-setup.md) (if the link does not work, try refreshing or opening in private navigation)

Make sure to remember the password you set during this step, you will need it later.

### Setting up Visual Studio Code

Visual Studio Code is pretty much necessary for development.

> apologies if this is not your favorite IDE. Please do [share](https://github.com/iBicha/playlet/issues/new?title=I%20don%27t%20like%20VS%20Code) if you feel this should not be a requirement.

Once you have it installed, you probably want to install the recommened plugins for this project, such as [BrightScript Language extension for VSCode](https://marketplace.visualstudio.com/items?itemName=RokuCommunity.brightscript) and [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

Next, create a file `.env` containing the following:

```makefile
ROKU_DEV_TARGET=INSERT_IP_HERE
ROKU_DEVPASSWORD=INSERT_PASSWORD_HERE
```

Where `ROKU_DEV_TARGET` is the local ip address of your Roku device, and `ROKU_DEVPASSWORD` is the developer password from [Roku Developer mode](#roku-developer-mode).

Now from VS Code, press the Play button with the target `Playlet (dev)` selected. This should build and run Playlet on your device in dev mode.

## Tools

### BrightScript Language Extension for VS Code

The [BrightScript Language extension for VSCode](https://marketplace.visualstudio.com/items?itemName=RokuCommunity.brightscript) includes many useful tools for development and debugging. Includes things like

- Sending commands to the App
  - Like getting the focused node, inspecting values, etc
- SceneGraph inspector
  - Allows you to see the hiearchy of the scene, and even modify elements at runtime. Useful for quick tweaks or adjusting UI.
- Roku Registry
  - Allows you to inspect the content of the [Registry](https://developer.roku.com/en-ca/docs/references/brightscript/components/roregistry.md)

Playlet is configured to have all these features available when run in debug mode.

### RALE (Roku Advanced Layout Editor)

[The Roku Advanced Layout Editor, aka RALE](https://devtools.web.roku.com/roku-advanced-layout-editor/), is a tool that provides a hierarchical view of the node tree in a Roku Scene Graph channel.
It's a standalone application that you can optionally install.

It's sometimes useful when designing UI and inspecting values of nodes.

Well, if you do happen to use it, Playlet is configured to connect to RALE.

### BrighterScript

[BrighterScript](https://github.com/rokucommunity/brighterscript) is a community driven programming language that compiles to BrightScript and has [useful features](https://github.com/rokucommunity/BrighterScript/blob/master/docs/readme.md). Playlet uses BrighterScript features a lot across the code base, and even implements a few of BrighterScript plugins.

### BrighterScript Linter/Formatter

Playlet uses [bslint](https://github.com/rokucommunity/bslint) and [brighterscript-formatter](https://github.com/rokucommunity/brighterscript-formatter).

You can use these commands to lint/format Playlet code:

```bash
npm run format
npm run format:fix
npm run lint
npm run lint:fix
```

### BrighterScript Plugins

See [Playlet Brighterscript Plugins](./plugins.md)

## Playlet App

Playlet is split into two parts: `Playlet App` and `Playlet Lib`.

`Playlet App` is a regular Roku app, that uses a [ComponentLibrary](https://developer.roku.com/en-ca/docs/references/scenegraph/control-nodes/componentlibrary.md) to load the rest of the app from [Playlet Lib](#playlet-lib).

In a way, `Playlet App` is a thin loader, while most of the logic lives in [Playlet Lib](#playlet-lib).

`Playlet App` is responsible for a few things:

- Load `Playlet lib`
  - By default, it tries to load the latest version from Github
  - If that fails (for example, if Github was down), it fallsback to loading an embedded copy of Playlet Lib
    - `if Github was down` -> yes, this has happened in the past, and it did not stop Playlet for working.
  - In dev mode, it loads Playlet lib that's being served by [BrightScript Language Extension for VS Code](#brightscript-language-extension-for-vs-code)
  - Once loaded, Playlet loads the `MainScene` from Playlet Lib
- Pass Launch parameters and Input parameters to Playlet Lib
- Show a loading screen and wait for Playlet Lib to hide it

That's pretty much it.

### Why separate between Playlet and Playlet Lib?

There are a few reasons we made this separation:

- Playlet relies on [Invidious](https://github.com/iv-org/invidious). Invidious tries to keep up with YouTube making changes to their platform, but sometimes, a breaking change happens that requires Playlet to react quickly. Releasing through the Roku Channel store can take days, or a week. During this time, Playlet would be not functional, and that's not acceptable.
- The ability to roll back: Sometimes an app breaking bug gets released. Allowing users to choose a seperate version is a flexible way to keep things working. For example, it's possible to choose a different verrsion from the developer settings in the web app.
- It is simply easier to release: Releasing Playlet Lib on Github, and everyone receives the latest version immediately, is very convenient and less of a hassle, than going through the Roku Channel store.
  - I've had instances where I was trying to pass the certfication for Playlet to publish it. One of the criterias is to pass a some automated tests. But the tests were failing because their system could not connect to their Roku test devices (connection keeps timing out). My only option was to keep trying over and over until it worked.
  - It might sound that Playlet Lib is just a workaround for the Roku Channel release process. But phrased differently, Roku Channel release process is not good enough of what we need for Playlet.
- Canary builds: The latest version of Playlet can be tested as soon as it lands in the main branch. This is a great way to test newer features in production, without affecting the stability of the released version. Roku has the concept of "beta" channels, but they are more cumbersome.
- Enable forks. If for some reason someone wanted to use a fork of Playlet (for example, another folk had other features or bug fixes that this repo doesn't), they don't need to publish a complete new app. The url to load playlet is configurable, and can be changed through a simple web api. Allowing and enabling forks is what makes FOSS thrive.

## Playlet Lib

`Playlet Lib` is a [ComponentLibrary](https://developer.roku.com/en-ca/docs/references/scenegraph/control-nodes/componentlibrary.md) that gets loaded by [Playlet App](#playlet-app). It containes pretty much all the logic needed to run the app.

### WebServer

Playlet lib comes equipped with a web server that runs on port 8888 when the app starts. This server enables:

- The communication between Playlet and [Playlet Web App](#playlet-web-app)
  - Through http calls, and even through web sockets for real time events
  - Allows remotely casting videos, change preferences, etc.
- Authentication using Invidious

The web server runs on a continuously running [Task](https://developer.roku.com/en-ca/docs/references/scenegraph/control-nodes/task.md) and uses a middeware system to manage routes, serve static files, [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), and more.

Please note: while we would like to keep the API stable as much as possible, Playlet can't reasonbly maintain multiple versions of the API like traditional web apis, because it adds complexity and maintainablity burden on an app the runs in constrained environment. In short, we'll try not to break the API, but we might from time to time.

#### Debug endpoints

Additionally, the web server exposes Web APIs in debug mode to help with debugging. To name a few examples:

- `/debug/pkg` to inspect files under Playlet App
- `/debug/libpkg` to inspect files under Playlet Lib
- `/debug/tmp` and `/debug/cachefs` to inspect files in temporary and cache

These are useful to see if the files and caching are working as expected.

### Releases from Github

Since Component Libraries are simply zip/squashfs files hosted at some HTTPS endpoint, Github releases are used to host and deliver Playet Lib to users. By default, Playlet grabs `https://github.com/iBicha/playlet/releases/latest/download/playlet-lib.squashfs.pkg` and loads it, but this can be pointed to somewhere else, if for some reason the Github repository becomes unavailable.
Squashfs files are faster to load, but they require signing. Zip files can be used without signing if they are served from an HTTPS endpoint.

### Dev library hosted by VS Code Extension

When in debug mode, Playlet lib is packaged and served locally on port 8086, and Playlet app would use it instead of the Playlet lib from Github. This is an important detail, because once you stop debugging in VS Code, the dev app on your Roku TV won't function anymore, with an error:

> Could not load Playlet component library from any of the following urls:
>
> - \[debug\] http://192.168.1.x:8086/playlet-lib.zip <!-- markdownlint-disable-line -->
>   Please restart Playlet.
>   If the problem persist, contact Playlet authors.

### Feature flags

Playlet uses [bs_const](https://developer.roku.com/en-ca/docs/references/brightscript/language/conditional-compilation.md#manifest-constant) to define feature flags. The flags are usually for features that introduce a downside, or require further refinement.

### User preferences

Playlet uses a json file that lists user preferences. It should be under [playlet-lib/src/config/preferences.json5](/playlet-lib/src/config/preferences.json5)
This file defines the kind of preferences that users can change, such as autoplay, preferred quality, and so on.

This file is parsed at runtime and UI for the settings is generated. The same mechanism is used for Playlet and the Web App.

Additionally, the web server exposes the settings under `/api/preferences`, which can enable importing/exporting user preferences.

### Home page layout

When Playlet starts, it shows a video feed on the screen. Subscription, Trending videos, and so on.

The layout is defined under [playlet-lib/src/config/default_home_layout.yaml](/playlet-lib/src/config/default_home_layout.yaml).

This could allow users to define custom layouts, so they can see what they find relevant in the home page. This can include Subscription, Trending, Popular videos, Search per keywords, or Playlists.

Additionally each feed has information on how it is fetched. For now, only Invidious can be data source, but other systems should be configured in the same way.

Invidious API definitions are defined under [playlet-lib/src/config/invidious_video_api.yaml](/playlet-lib/src/config/invidious_video_api.yaml), and Playlet parses these at runtime and make the right API calls to fetch the data.

Finally, this layout system is what allows both the BrightScript app and the Web app to display the same homepage.

## Testing

Playlet uses [Rooibos](https://github.com/georgejecook/rooibos) for testing.

Files following the pattern `*.spec.bs` are considered test files and are only included in test builds.
Additionally, sometimes tests require additional setup (creating test components with multiple files). In this case, they can all be placed in a folder named `tests`. Any `tests` folder will only be included in test builds.

Running the tests for both `playlet-app` and `playlet-lib` can be done with a single command:

```bash
npm run test
```

Which will build the test app, deploy, run tests and parse the output for results.

Tests do not cover a lot right now, but at least there's a testing setup in place.

## Playlet Web App

Playlet comes with a web app built with [Svelte](https://svelte.dev/). The web app can be used to browse videos, search, cast videos to TV, and even change preferences.

The web app gets served using the Playlet web server. It also interacts with the web APIs from the web server.
It's important to note that if Playlet is not ON (on your Roku device) or the TV is in screen saver mode, then the web app can't be used.

When Playlet gets built, several steps happen:

1. The web app gets kicked off first. The web app artifacts gets written to `playlet-lib/src/www`
1. Playlet lib gets built second. As part of the build pipeline, a copy of `playlet-lib.zip` is made under `playlet-app/src/lib/playlet-lib.zip`
1. Finally, Playlet app is built.

### Svelte development

The web app uses [Svelte](https://svelte.dev/), [Vite](https://vitejs.dev/) and [Typescript](https://www.typescriptlang.org/) primarily. It currently does not use [SvelteKit](https://kit.svelte.dev/), since it doesn't need some of the more advanced features that SvelteKit offers, such as routing or server-side rendering (SSR)

Since modifying the web app code requires building all three projects (Playlet, Playlet lib, and Playlet web app) this makes the iteration speed very slow, and we lose the benefits of web development, such as hot reloads.

For that reason, the recommended iteration when working on the web app is:

1. Start `Playlet (dev)` (by selecting `Playlet (dev)` and pressing Play in VS Code)
1. Once Playlet starts, switch to `Playlet Web (dev)` and press play. Do not stop `Playlet (dev)`
1. The web app should start in the browser

You will notice that the browser tab that just opened shows an url like `http://192.168.1.X:5173/?host=192.168.1.Y:8888`

This is because the web app will be served from Vite, while API calls to the Playlet will be done to the Playlet lib webserver.

For debugging, choose the compound target `Playlet Web (Debug)`.

### Tailwind/Daisy UI

The Playlet web app uses [Tailwind CSS](https://tailwindcss.com/) as its base styling library. Additionally, it uses [DaisyUI](https://daisyui.com/) as it offers a versatile set of components, and has built-in supports for themes.

### API calls

The Playlet web app communicates with the Playlet Roku app using web APIs. The web app also uses Invidious apis documented at [https://docs.invidious.io/api](https://docs.invidious.io/api)

#### API calls (proxy authenticated)

When making authenticated calls to Invidious (for example to fetch the user Subscription feed) the Bearer token is needed.

In this case specifically, the web server acts as a proxy between Invidious and the web app. This is for a few reasons:

- CORS: Bearer token can't go through to Invidious from the web app (due to missing `Access-Control-Allow-Credentials` header)
- The web server is not secure: it's not on HTTPS
- It's best if the Invidious access token would not be served to the web app, and remain on the Roku device

For API calls that don't require authentication, the web app fetches data from Invidious directly.

### Developer settings

The developer settings are found at the buttom of the settings page.

One setting that is only available in the web app is `Playlet Library version`. It allows you to point to a different Github release other than the default `latest`.

This is mostly useful to QA the `canary` release (see [Canary release](https://en.wikipedia.org/wiki/Feature_toggle#Canary_release)) in a "production" setting before making it available to all users as the official "latest" version.

#### In case of a softlock

If the dev menu is used to load a custom Playlet lib url, but you couldn't revert back:

```bash
curl -d '' "http://$ROKU_DEV_TARGET:8060/launch/693751?clearPlayletLibUrls=true"
```

This will remove the custom lib, and revert to using default (latest release from Github).

If you need to clear all the data from the registry, use

```bash
curl -d '' "http://$ROKU_DEV_TARGET:8060/launch/693751?clearRegistry=true"
```

## CI/CD

On pull requests, a Github action will run `lint:fix` and `format:fix` and push changes to the PR branch, to keep things tidy.

When merged to main branch, a Github action will build Playlet, run static analysis using Roku's [Static Channel Analysis tool](https://devtools.web.roku.com/#static-channel-analysis-tool), and release a new version tagged `canary`, with the build artifacts attached, and changelog included.

Existing `canary` release will be removed before creating a new one.

This makes [Releasing](./RELEASING.md) simpler.
