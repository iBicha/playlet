// integration test to play a video on the Roku device
// 1. Run dev channel on the Roku device (Playlet (dev))
// 2 npm run restart-app && npm run test:integration
import { ecp, odc } from 'roku-test-automation';
import { setupEnvironment } from './common';

setupEnvironment();

(async () => {
    await ecp.sendInput({ params: { contentId: "jNQXAC9IVRw" } });

    await odc.onFieldChangeOnce({
        base: "scene",
        keyPath: "#VideoQueue.player.state",
        match: "playing",
    });

    console.log("Video started playing");

    await odc.shutdown();
})();
