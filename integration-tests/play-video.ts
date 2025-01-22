// integration test to play a video on the Roku device

import { ecp, odc } from 'roku-test-automation';
import { AppId, setupEnvironment } from './common';
import { Key } from 'roku-test-automation/client/dist/ECP';

async function playVideoDev() {
    setupEnvironment(AppId.DEV);

    await ecp.sendLaunchChannel({ params: { contentId: "jNQXAC9IVRw" } });
    await ecp.sleep(5000);

    await odc.onFieldChangeOnce({
        base: "scene",
        keyPath: "#VideoQueue.player.state",
        match: "playing",
    });

    console.log("Video started playing");

    await odc.shutdown();
    await ecp.sendKeypress(Key.Home);
}

async function playVideoProd() {
    setupEnvironment(AppId.PROD);

    let playerState = (await ecp.getMediaPlayer()).state;
    await ecp.sendLaunchChannel({ params: { contentId: "jNQXAC9IVRw" } });

    const TIMEOUT = 20000;
    const start = Date.now();
    while (Date.now() - start < TIMEOUT) {
        const newPlayerState = (await ecp.getMediaPlayer()).state;
        if (newPlayerState !== playerState) {
            console.log("Player state changed: ", newPlayerState);
            playerState = newPlayerState;
        }
        if (playerState === "play") {
            console.log("Video started playing");
            break;
        }
        await ecp.sleep(1000);
    }

    await ecp.sendKeypress(Key.Home);
}

(async () => {
    await playVideoDev();
    await playVideoProd();
})();
