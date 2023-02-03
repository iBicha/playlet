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

async function updatePlaylist(sourceUrl, destinationPlaylist, profile, browser = undefined, limit = 100) {
    console.log(`Updating playlist "${destinationPlaylist}" from feed "${sourceUrl}"`);

    profile.playlists = profile.playlists
        .filter(playlist => playlist.title !== destinationPlaylist);

    const videos = await extractVideos(sourceUrl, browser, limit);

    profile.playlists.push({
        title: destinationPlaylist,
        description: "Imported from Youtube",
        privacy: "private",
        videos: videos
    });
}

async function deletePlaylists(invidiousInstance, token, playlistNames) {
    const playlistsToDelete = (await getPlaylists(invidiousInstance, token))
        .filter(playlist => playlistNames.indexOf(playlist.title) !== -1);

    for (let i = 0; i < playlistsToDelete.length; i++) {
        const playlist = playlistsToDelete[i];
        await deletePlaylist(invidiousInstance, token, playlist);
    }
}

async function getPlaylists(invidiousInstance, token) {
    console.log(`Finding playlists`)
    const response = await fetch(`${invidiousInstance}/api/v1/auth/playlists`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    return await response.json()
}

async function deletePlaylist(invidiousInstance, token, playlist) {
    console.log(`Playlist "${playlist.title}" exists. Deleting.`)
    await fetch(`${invidiousInstance}/api/v1/auth/playlists/${playlist.playlistId}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        method: "DELETE"
    })
}

async function extractVideos(sourceUrl, browser = undefined, limit = 100) {
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
        const currentPlaylists = await getPlaylists(invidiousInstance, token);

        await updatePlaylist("https://www.youtube.com", "Recommended", profile, browser);
        const playlistsToDelete = ["Recommended"]

        if (browser) {
            console.log("Updating subscriptions")
            profile.subscriptions = await extractSubscriptionChannels(browser)

            console.log("Updating watch history")
            profile.watch_history = await extractVideos("https://www.youtube.com/feed/history", browser)

            await updatePlaylist("https://www.youtube.com/playlist?list=WL", "Watch later", profile, browser)
            playlistsToDelete.push("Watch later")

            await updatePlaylist("https://www.youtube.com/playlist?list=LL", "Liked Videos", profile, browser)
            playlistsToDelete.push("Liked Videos")
        }

        await deletePlaylists(invidiousInstance, token, playlistsToDelete)
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
