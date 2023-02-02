// This script reads recommendations, subscriptions, watch later, liked, and history from Youtube
// and imports them into invidious.

const { ArgumentParser } = require('argparse')
const fs = require('fs');
const dotenv = require('dotenv');
const spawn = require('child_process').spawn;
const express = require('express')
const ip = require('ip');

const config = dotenv.parse(fs.readFileSync('.vscode/.env'));
const PLAYLEY_SERVER = `http://${config.ROKU_DEV_TARGET}:8888`;

async function exportInvidiousProfile(invidiousInstance, token) {
    console.log(`Exporting Invidious profile`)
    const response = await fetch(`${invidiousInstance}/api/v1/auth/export/invidious`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    return await response.json()
}

async function importInvidiousProfile(invidiousInstance, token, profile) {
    console.log(`Importing Invidious profile`)
    await fetch(`${invidiousInstance}/api/v1/auth/import/invidious`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(profile)
    })
}

async function updatePlaylist(sourceUrl, destinationPlaylist, profile, browser = undefined, limit = 50) {
    console.log(`Updating playlist "${destinationPlaylist}" from feed "${sourceUrl}"`);

    const videos = await extractVideos(sourceUrl, browser, limit);

    let playlistIndex = profile.playlists.findIndex((playlist) => playlist.title === destinationPlaylist);
    if (playlistIndex === -1) {
        profile.playlists.push({
            title: destinationPlaylist,
            privacy: "private"
        });
        playlistIndex = profile.playlists.length - 1
    }

    profile.playlists[playlistIndex].description = "Imported from Youtube";
    profile.playlists[playlistIndex].videos = videos
}

async function extractVideos(sourceUrl, browser = undefined, limit = 50) {
    console.log(`Extracting videos from feed "${sourceUrl}" with limit "${limit}"`)
    return await new Promise(function (resolve, reject) {
        let ytDlpErrors = ""
        const videos = []

        args = [sourceUrl, '--flat-playlist', '--lazy-playlist', '--print', '%(id)s']
        if (browser) {
            args.push('--cookies-from-browser', browser)
        }
        const ytDlpProcess = spawn('yt-dlp', args);

        ytDlpProcess.stdout.on('data', function (data) {
            process.stdout.write('.')
            if (videos.length > limit) {
                return;
            }
            newVideos = data.toString()
                .split('\n')
                .map(video => video.trim())
                .filter(i => i);

            newVideos.forEach(video => {
                videos.push(video)
            });

            if (videos.length >= limit) {
                ytDlpProcess.kill()
            }
        });

        ytDlpProcess.stderr.on('data', function (data) {
            process.stdout.write('.')
            ytDlpErrors += data.toString() + '\n'
        });

        ytDlpProcess.on('close', function (code) {
            process.stdout.write('\n')
            if (code === 0 || videos.length === limit) {
                resolve(videos)
            } else {
                reject({ code: code, error: ytDlpErrors })
            }
        });
    })
}

async function extractSubscriptionChannels(browser) {
    console.log(`Extracting channels from feed/subscriptions`)
    return await new Promise(function (resolve, reject) {
        let ytDlpErrors = ""
        const channels = new Set()

        args = ['https://www.youtube.com/feed/subscriptions', '--flat-playlist', '--lazy-playlist', '--print', '%(channel_id)s']
        if (browser) {
            args.push('--cookies-from-browser', browser)
        }
        const ytDlpProcess = spawn('yt-dlp', args);

        ytDlpProcess.stdout.on('data', function (data) {
            process.stdout.write('.')
            newChannels = data.toString()
                .split('\n')
                .map(id => id.trim())
                .filter(i => i);

            newChannels.forEach(channel => {
                channels.add(channel)
            });
        });

        ytDlpProcess.stderr.on('data', function (data) {
            process.stdout.write('.')
            ytDlpErrors += data.toString() + '\n'
        });

        ytDlpProcess.on('close', function (code) {
            process.stdout.write('\n')
            if (code === 0) {
                resolve(Array.from(channels))
            } else {
                reject({ code: code, error: ytDlpErrors })
            }
        });
    })
}

async function getInvidiousInstance() {
    const state = await (await fetch(`${PLAYLEY_SERVER}/api/state?key=invidious`)).json()
    if (!state.invidious.logged_in) {
        throw new Error("Playlet not logged in")
    }

    console.log(`Invidious instance: ${state.invidious.logged_in_instance}`)
    return state.invidious.logged_in_instance;
}

async function getAccessToken(invidiousInstance) {
    return new Promise(function (resolve, reject) {
        let server = undefined;
        const app = express()
        const port = 55432
        app.get('/invidious/token_callback', (req, res) => {
            if (!req.query.token) {
                console.warn('No token received on /invidious/token_callback')
                res.status(400).send('No token received on /invidious/token_callback')
                return
            }
            token = decodeURIComponent(decodeURIComponent(req.query.token))
            resolve(token)
            console.log(`Access token received: ${token}`)
            res.send("Token received. You can close this window now.")
            server.close()
        })

        const scope = ":*"
        const expire = Date.now() + 60 * 60 * 2;
        const callbackUrl = `http://${ip.address()}:${port}/invidious/token_callback`
        const authLink = `${invidiousInstance}/authorize_token?scopes=${scope}&callback_url=${callbackUrl}&expire=${expire}`

        server = app.listen(port, () => {
            console.log(`server is listening on http://localhost:${port}`);
            console.log(`Login using your browser: ${authLink}`)
        });
    })
}

async function deleteAccessToken(invidiousInstance, token) {
    await fetch(`${invidiousInstance}/api/v1/auth/tokens/unregister`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: token
    })
}

(async () => {
    let invidiousInstance = undefined
    let token = undefined;
    try {
        const parser = new ArgumentParser({
            description: 'Sync Youtube profile with Invidious'
        });

        parser.add_argument('--browser', { help: 'Use cookies from browser' });
        parser.add_argument('--invidious', { help: 'Invidious instance to sync to' });

        let args = parser.parse_args()
        invidiousInstance = args.invidious
        browser = args.browser

        if (!invidiousInstance) {
            try {
                invidiousInstance = await getInvidiousInstance()
            } catch (error) {
                throw new Error(`Could not connect to Playlet at ${PLAYLEY_SERVER}\n${error}`)
            }
        }

        token = await getAccessToken(invidiousInstance)

        const profile = await exportInvidiousProfile(invidiousInstance, token);

        await updatePlaylist("https://www.youtube.com", "Recommended", profile, browser)

        if (browser) {
            console.log("Updating subscriptions")
            profile.subscriptions = await extractSubscriptionChannels(browser)
            console.log("Updating watch history")
            profile.watch_history = await extractVideos("https://www.youtube.com/feed/history", browser)

            await updatePlaylist("https://www.youtube.com/playlist?list=WL", "Watch later", profile, browser)
            await updatePlaylist("https://www.youtube.com/playlist?list=LL", "Liked Videos", profile, browser)
        }

        await importInvidiousProfile(invidiousInstance, token, profile);
    }
    catch (error) {
        console.error(error);
    }
    finally {
        if (token) {
            console.log("Deleting token")
            await deleteAccessToken(invidiousInstance, token)
            console.log("Done!")
        }
    }
})();
