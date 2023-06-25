# Playlet
<p align="center">
  <img src="banner.png" style="display:block;text-align:center" alt="Playlet Logo" width="800"/>
  <br/><br/>
  <a href="https://github.com/iBicha/playlet/actions/workflows/release.yml?query=branch%3Amain">
    <img alt="Build Status" src="https://img.shields.io/github/actions/workflow/status/iBicha/playlet/release.yml.svg?branch=main"/>
  </a>
  <a href="https://github.com/iBicha/playlet/releases">
    <img alt="Current Release" src="https://img.shields.io/github/release/iBicha/playlet.svg"/>
    <img alt="Total Downloads" src="https://img.shields.io/github/downloads/iBicha/playlet/latest/playlet-lib.zip.svg"/>
  </a>
  <a href="https://github.com/iBicha/playlet">
    <img alt="AGPL-3.0 license" src="https://img.shields.io/github/license/iBicha/playlet.svg"/>
  </a>
  <a href="https://channelstore.roku.com/en-ca/details/840aec36f51bfe6d96cf6db9055a372a/playlet">
    <img alt="Roku Channel Store" src="https://img.shields.io/badge/Roku%20Store-Install-blueviolet?logo=roku&logoColor=blueviolet&labelColor=white"/>
  </a>
</p>


Playlet is an unofficial Youtube client for Roku 📺

## Features
- 🔥 No Ads (Not now, not ever)
- 🕵️ No Tracking
- 🛡️ Privacy driven (uses Invidious backend)
- ⚔️ SponsorBlock integration (skips undesirable sections in videos)
- 📱 Browse, search, and cast from phone using the web app
- 🔮 Picture-in-picture mode
- ⚡ Fast! [Check out how we compare with the official Youtube app](https://youtu.be/qmSvA-QQW20)

### Cast from phone
1. Open "Web app" tab in Playlet
1. Scan QR Code with Phone
1. Browse or search videos
1. Click the video and choose the "Play on TV" option

### Picture-in-picture
- When viewing a video in full screen, press ⬇️ (down) button on your remote to shrink the video
- You can browser or search for videos while you watch 
- To restore currently playing video to full screen, press the ✳️ (options) button

### Customize Invidious instance
1. Open settings in Playlet
1. Scan QR Code with Phone
1. Change the Invidious instance
1. You can also do this from the settings tab

## Screenshots
| ![](screenshots/screenshot1.jpg) | ![](screenshots/screenshot2.jpg) | ![](screenshots/screenshot3.jpg) |
|----------------------------------|----------------------------------|----------------------------------|

More under [Screenshots](./screenshots)

## Installation
### Roku Store (Published app)
[Playlet on Roku channel store](https://channelstore.roku.com/en-ca/details/840aec36f51bfe6d96cf6db9055a372a/playlet)
Or use the link https://my.roku.com/account/add?channel=PLAYLET

### Sideloaded (Dev app)
#### Enable Roku Developer Mode
First, you need to enable developer mode on your Roku TV (if you have not done that already).

Using your Roku remote, enter the following sequence:

<img src="https://image.roku.com/ZHZscHItMTc2/dev-startup1.png" alt="DevSequence" width="350"/>

For full instructions, see [Set up your Roku device to enable Developer Settings](https://developer.roku.com/en-ca/docs/developer-program/getting-started/developer-setup.md#step-1-set-up-your-roku-device-to-enable-developer-settings)

Make sure to remember the password you set during this step, you will need it later.

#### Gather your info
By now, you should have the following
- Your Roku Dev password (setup in the previous step)
- Your Roku TV local IP address
  - You can find this information in your TV network settings. It should look like 192.168.X.X or so

#### Install Playlet (Manual)
1. Go to `https://github.com/iBicha/playlet/releases` and download `playlet.zip`
2. Open `http://REPLACE_IP_ADDRESS_HERE/` (e.g. http://192.168.1.2/) in your browser
3. If prompted for username and password
  - The username is `rokudev`
  - The password is whatever you set when you enabled Developer mode
4. Click on `Upload` button and select the `playlet.zip` file you downloaded in step 1
6. Click `Install with zip` button
  - If you're updating the app (or you already have a dev channel) the button would say `Replace with zip`

## Development
1. `git clone https://github.com/iBicha/playlet.git`
1. `cd playlet`
1. `npm install`

Create a file under `playlet/.vscode/.env` containing:
```
ROKU_DEV_TARGET=REPLACE_IP_ADDRESS_HERE
ROKU_DEVPASSWORD=REPLACE_PASSWORD_HERE
```

Then you can open the project using VS Code and deploy to your Roku TV using the Debug button.

## Why Playlet
```
playlet - noun
play•let /ˈplālət/
: a short play
```

**Playlet** is about keeping the time you spend on Youtube short and useful. It values your time, so it does not show you ads, and allows you to skip sponsored sections and other irrelevant information that's designed to monitize you and/or waste your time.

There's a cliché about how a lot of open source software is **`"Made with ♡"`**. This project in particular is **not**.<br/>
**Playlet** was created out of **spite**, because I believe I have watched enough back-to-back, unskippable Youtube ads for a lifetime.

By removing all the bloat, the ads, the tracking, we could end up with an even faster app than the official one.

In any case, I hope you find **Playlet** useful, and pleasant to use.

## Disclaimer
**Playlet** does not serve or distribute any material from unauthorized sources.<br/>
**Playlet** is simply a frontend to other systems (such as https://github.com/iv-org/invidious), bringing the watching experience to the TV, as opposed to the existing frontends that are web and mobile focused.
