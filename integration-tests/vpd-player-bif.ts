// VideoPlayerDev scrub-filmstrip (BifDisplay) e2e: enter scrub on a clip with storyboards and assert the center
// thumbnail tile actually LOADED the right image — not just that the strip is visible (guards a blank/wrong-tile
// regression a `#bifDisplay.visible` check would miss).
//
//   cd references/playlet-legacy && npx tsx ./integration-tests/vpd-player-bif.ts
//   PLAYER_BIF_ID=<id> npx tsx ./integration-tests/vpd-player-bif.ts   # override the clip
//
// The tile texture's `loadStatus == "ready"` is the real load signal — `loadWidth` reads 0 even when loaded.

import { Key, Mode, press, launchVod, finish, group, field, expectField, expectPred, check, waitFor } from './vpd-player-harness';

const BIF_ID = process.env.PLAYER_BIF_ID || 'aqz-KE-bpKQ'; // Big Buck Bunny (Blender) — 10min, has storyboards

interface TileSet {
    htiles?: number;
    vtiles?: number;
    duration?: number;
    final_time?: number;
}

(async () => {
    await launchVod(BIF_ID);

    group('scrub shows a filmstrip with a real, loaded center tile');
    await press(Key.Left);
    await waitFor('#bifDisplay.transportMode', (v) => v === Mode.scrub, 'scrub engaged before stepping');
    await press(Key.Right); // step the cursor into the storyboard range
    await expectField('#bifDisplay.transportMode', Mode.scrub);
    await expectField('#bifDisplay.visible', true);

    const ts = await field<TileSet>('#bifDisplay.tileSet');
    check('native tile-set present (grid > 0)', !!ts && (ts.htiles ?? 0) > 0 && (ts.vtiles ?? 0) > 0, { grid: `${ts?.htiles}x${ts?.vtiles}`, duration: ts?.duration });

    const uri = await field<string>('#bifTileC.uri');
    check('center tile uri is an http(s) storyboard url', typeof uri === 'string' && /^https?:\/\//.test(uri), uri);

    await expectPred('#bifTileC.loadStatus', (v) => v === 'ready', 'center tile texture loaded', 6000);

    group('commit returns to idle and the strip self-hides');
    await press(Key.Ok);
    await expectField('#bifDisplay.transportMode', Mode.idle);
    await expectField('#bifDisplay.visible', false);

    await finish();
})();
