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

async function updateFeed(sourceUrl, destinationPlaylist, invidiousInstance, token, browser = undefined, limit = 50) {
    console.log(`Updating playlist "${destinationPlaylist}" from feed "${sourceUrl}"`)

    const videos = await extractVideos(sourceUrl, browser, limit);

    let playlist = await getPlaylist(invidiousInstance, token, destinationPlaylist)
    if (playlist) {
        await deletePlaylist(invidiousInstance, token, playlist)
    }

    playlist = await createPlaylist(invidiousInstance, token, destinationPlaylist)
    for (let i = 0; i < videos.length; i++) {
        const videoId = videos[i];
        console.log(`Adding video "${videoId}" (${i + 1}/${videos.length}) to playlist "${playlist.title}"`)
        await addPlaylistVideo(invidiousInstance, token, playlist, videoId)
    }
}

async function getPlaylist(invidiousInstance, token, playlistName) {
    console.log(`Finding playlist ${playlistName}`)
    const response = await fetch(`${invidiousInstance}/api/v1/auth/playlists`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    const playlists = await response.json()
    return playlists.find(p => p.title === playlistName);
}

async function createPlaylist(invidiousInstance, token, playlistName) {
    console.log(`Creating playlist "${playlistName}"`)
    const response = await fetch(`${invidiousInstance}/api/v1/auth/playlists`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ title: playlistName, privacy: "private" })
    })
    return await response.json()
}

async function addPlaylistVideo(invidiousInstance, token, playlist, videoId) {
    await fetch(`${invidiousInstance}/api/v1/auth/playlists/${playlist.playlistId}/videos`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ videoId: videoId })
    })
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
            videos.push(data.toString().trim())
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

        await updateFeed("https://www.youtube.com/", "Youtube - Recommended", invidiousInstance, token, browser)
        if (browser) {
            await updateFeed("https://www.youtube.com/feed/subscriptions", "Youtube - Subscriptions", invidiousInstance, token, browser)
            await updateFeed("https://www.youtube.com/playlist?list=WL", "Youtube - Watch later", invidiousInstance, token, browser)
            await updateFeed("https://www.youtube.com/playlist?list=LL", "Youtube - Liked Videos", invidiousInstance, token, browser)
            await updateFeed("https://www.youtube.com/feed/history", "Youtube - History", invidiousInstance, token, browser)
        }
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
