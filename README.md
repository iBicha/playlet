# Playlet
Unofficial Youtube client for Roku.

## Features
- No Ads (I guess that's a feature)
- Privacy driven (uses Invidious backend)
- SponsorBlock integration (skips undesirable sections in videos)

## Installation

### Enable Roku Developer Mode
First, you need to enable developer mode on your Roku TV (if you have not done that already).

Using your Roku remote, enter the following sequence:

![DevSequence](https://image.roku.com/ZHZscHItMTc2/dev-startup1.png)

For full instructions, see [Set up your Roku device to enable Developer Settings](https://developer.roku.com/en-ca/docs/developer-program/getting-started/developer-setup.md#step-1-set-up-your-roku-device-to-enable-developer-settings)

Make sure to remember the password you set during this step, you will need it later.

### Gather your info
By now, you show have the following
- Your Roku Dev password (setup in the previous step)
- Your Roku TV local IP address
  - You can find this information in your TV network settings. It should look like 192.168.X.X or so

### Install Youbtube for Roku (command line)

Install Youbtube for Roku as a dev channel using this command, and replace:
- `REPLACE_PASSWORD_HERE` : with your Roku Dev password
- `REPLACE_IP_ADDRESS_HERE` : with your Roku TV local IP address
```
curl https://raw.githubusercontent.com/iBicha/playlet/main/install.sh | ROKU_DEV_TARGET=REPLACE_IP_ADDRESS_HERE DEVPASSWORD=REPLACE_PASSWORD_HERE sh
```
Example:
```
curl https://raw.githubusercontent.com/iBicha/playlet/main/install.sh | ROKU_DEV_TARGET=192.168.1.2 DEVPASSWORD=1234 sh
```


If successful, you should see some output on your terminal, with `Status: 200`.

You should see a new channel on your Roku TV, with "Roku Developers" Logo (we'll get this thing a logo)

### Install Youbtube for Roku (Manual)
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
