// Description: Read recommendations, subscriptions, watch later, liked, and history from YouTube
// and import them into invidious. Requires yt-dlp to be installed.

const { ArgumentParser } = require('argparse')
const fs = require('fs');
const getEnvVars = require('./get-env-vars');
const spawn = require('child_process').spawn;
const express = require('express')
const ip = require('ip');
const fetch = require('cross-fetch');

function getArgumentParser() {
    const parser = new ArgumentParser({
        description: 'Sync YouTube profile with Invidious'
    });

    parser.add_argument('--browser', { help: 'Use cookies from browser' });
    parser.add_argument('--invidious', { help: 'Invidious instance to sync to' });
    parser.add_argument('--invidious-token-file', { help: 'Invidious auth token. If provided, manual authorization will be skipped' });
    parser.add_argument('--output-file', { help: 'Write profile to Invidious JSON compatible file' });
    parser.add_argument('--playlist-limit', { help: 'Maximum playlist video count', type: 'int', default: 500 });

    return parser;
}

const config = getEnvVars();
const PLAYLEY_SERVER = `http://${config.ROKU_DEV_TARGET}:8888`;

const PLAYLIST_DESCRIPTION = "[Automatically imported from YouTube using profile-sync script]"

const INVIDIOUS_SCOPES = "POST:tokens/unregister,POST:import/invidious,GET:playlists,DELETE:playlists*"

async function importInvidiousProfile(invidiousInstance, token, profile) {
    const pieces = splitProfile(profile);
    console.log(`Importing Invidious profile (${pieces.length} items)`)
    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];
        console.log(`Importing "${piece.name}" (${i + 1}/${pieces.length})`)

        await fetch(`${invidiousInstance}/api/v1/auth/import/invidious`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify(piece.profile)
        })
    }
}

function splitProfile(profile) {
    const pieces = []
    if (profile.subscriptions) {
        pieces.push({
            name: "Subscriptions",
            profile: {
                subscriptions: profile.subscriptions
            }
        })
    }
    if (profile.watch_history) {
        pieces.push({
            name: "Watch History",
            profile: {
                watch_history: profile.watch_history
            }
        })
    }
    if (profile.playlists) {
        profile.playlists.forEach(playlist => {
            pieces.push({
                name: `Playlist: ${playlist.title}`,
                profile: {
                    playlists: [playlist]
                }
            })
        })
    }
    return pieces;
}

async function generatePlaylist(sourceUrl, playlistName, browser = undefined, limit = 100) {
    console.log(`Updating playlist "${playlistName}" from feed "${sourceUrl}"`);

    const videos = await extractYtDlp(sourceUrl, browser, limit);

    return {
        title: playlistName,
        description: PLAYLIST_DESCRIPTION,
        privacy: "private",
        videos: videos
    };
}

async function deletePlaylists(invidiousInstance, token, playlistNames) {
    const playlistsToDelete = (await getPlaylists(invidiousInstance, token))
        .filter(playlist => playlistNames.indexOf(playlist.title) !== -1)
        .filter(playlist => playlist.description === PLAYLIST_DESCRIPTION);

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

async function extractYtDlpPlaylists(browser) {
    console.log(`Extracting playlists`)
    return await new Promise(function (resolve, reject) {
        let ytDlpErrors = ""
        const items = []

        args = ["https://www.youtube.com/feed/library", '--flat-playlist', '--lazy-playlist', '--dump-json', '--cookies-from-browser', browser]
        const ytDlpProcess = spawn('yt-dlp', args);

        ytDlpProcess.stdout.on('data', function (data) {
            process.stdout.write('.')
            newItems = data.toString()
                .split('\n')
                .map(item => item.trim())
                .filter(i => i);

            newItems.forEach(item => {
                try {
                    const json = JSON.parse(item);
                    if (json.url?.startsWith("https://www.youtube.com/playlist?list")) {
                        items.push({
                            url: json.url,
                            title: json.title
                        })
                    }
                } catch (error) {
                    console.error(error)
                    ytDlpErrors += error
                }
            });
        });

        ytDlpProcess.stderr.on('data', function (data) {
            process.stdout.write('.')
            ytDlpErrors += data.toString() + '\n'
        });

        ytDlpProcess.on('close', function (code) {
            process.stdout.write('\n')
            if (code === 0) {
                resolve(items)
            } else {
                reject({ code: code, error: ytDlpErrors })
            }
        });
    })
}

async function extractYtDlp(sourceUrl, browser = undefined, limit = 100) {
    console.log(`Extracting from "${sourceUrl}" with limit "${limit}"`)
    return await new Promise(function (resolve, reject) {
        let ytDlpErrors = ""
        const items = []

        args = [sourceUrl, '--flat-playlist', '--lazy-playlist', '--print', '%(id)s']
        if (browser) {
            args.push('--cookies-from-browser', browser)
        }
        const ytDlpProcess = spawn('yt-dlp', args);

        ytDlpProcess.stdout.on('data', function (data) {
            process.stdout.write('.')
            if (limit > 0 && items.length > limit) {
                return;
            }
            newItems = data.toString()
                .split('\n')
                .map(item => item.trim())
                .filter(i => i);


            for (let i = 0; i < newItems.length && (items.length < limit || limit === -1); i++) {
                items.push(newItems[i])
            }

            if (limit > 0 && items.length >= limit) {
                ytDlpProcess.kill()
            }
        });

        ytDlpProcess.stderr.on('data', function (data) {
            process.stdout.write('.')
            ytDlpErrors += data.toString() + '\n'
        });

        ytDlpProcess.on('close', function (code) {
            process.stdout.write('\n')
            if (code === 0 || (limit > 0 && items.length === limit)) {
                resolve(items)
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

    console.log(`Invidious instance: ${state.invidious.current_instance}`)
    return state.invidious.current_instance;
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

        const scopes = encodeURIComponent(INVIDIOUS_SCOPES)
        const expire = Date.now() + 60 * 60 * 2;
        const callbackUrl = encodeURIComponent(`http://${ip.address()}:${port}/invidious/token_callback`)
        const authLink = `${invidiousInstance}/authorize_token?scopes=${scopes}&callback_url=${callbackUrl}&expire=${expire}`

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
    let unregisterToken = false;
    try {
        const parser = getArgumentParser()
        const args = parser.parse_args()

        invidiousInstance = args.invidious
        invidiousTokenFile = args.invidious_token_file
        browser = args.browser
        outputFile = args.output_file
        playlistLimit = args.playlist_limit

        const profile = { playlists: [] }

        profile.playlists.push(await generatePlaylist("https://www.youtube.com", "Recommended", browser, playlistLimit))
        const playlistsToDelete = ["Recommended"]

        if (browser) {
            console.log("Updating subscriptions")
            profile.subscriptions = await extractYtDlp("https://www.youtube.com/feed/channels", browser, -1)

            // console.log("Updating watch history")
            // profile.watch_history = await extractYtDlp("https://www.youtube.com/feed/history", browser, playlistLimit)

            const playlists = await extractYtDlpPlaylists(browser);
            for (let i = 0; i < playlists.length; i++) {
                const playlist = playlists[i];
                try {
                    profile.playlists.push(await generatePlaylist(playlist.url, playlist.title, browser, playlistLimit))
                    playlistsToDelete.push(playlist.title)
                } catch (error) {
                    console.log(error)
                }
            }
        }

        if (outputFile) {
            console.log(`Writing profile to ${outputFile}`)
            fs.writeFileSync(outputFile, JSON.stringify(profile, null, 2))
        } else {
            if (!invidiousInstance) {
                try {
                    invidiousInstance = await getInvidiousInstance()
                } catch (error) {
                    throw new Error(`Could not connect to Playlet at ${PLAYLEY_SERVER}\n${error}`)
                }
            }

            if (!invidiousTokenFile) {
                token = await getAccessToken(invidiousInstance)
                unregisterToken = true;
            } else {
                token = fs.readFileSync(invidiousTokenFile, 'utf8');
            }

            await deletePlaylists(invidiousInstance, token, playlistsToDelete)
            await importInvidiousProfile(invidiousInstance, token, profile);
        }
    }
    catch (error) {
        console.error(error);
    }
    finally {
        if (token && unregisterToken) {
            console.log("Deleting token")
            await deleteAccessToken(invidiousInstance, token)
        }
        console.log("Done!")
    }
})();
