// VideoPlayerDev live e2e: on the trackbar, OK toggles the HUD without pausing (stock live faithfulness);
// Rewind enters the live-DVR ladder. Live streams are unstable, so this skips cleanly when none is available
// and the DVR-ladder checks are soft (a stream may expose no DVR window).
//
//   cd references/playlet-legacy && npx tsx ./integration-tests/vpd-player-live.ts
//   PLAYER_LIVE_ID=<id> npx tsx ./integration-tests/vpd-player-live.ts   # override the stream

import { Key, Mode, Glyph, press, launch, finish, group, field, expectField, expectSoft, waitFor, frames } from './vpd-player-harness';
import { getLiveVideoId } from './live-id';

(async () => {
    // freshly-found live id (search, cached per session), then env override, then a hardcoded fallback.
    const LIVE_ID = process.env.PLAYER_LIVE_ID || (await getLiveVideoId()) || 'jfKfPfyJRdk';
    console.log(`live id: ${LIVE_ID}`);

    const playing = await launch(LIVE_ID, 45_000);
    if (!playing) {
        console.log(`live stream ${LIVE_ID} did not start — skipping`);
        await finish(true);
    }

    const isLive = await field<boolean>('#trickPlayBar.isLive');
    if (isLive !== true) {
        console.log(`stream ${LIVE_ID} is not live (isLive=${isLive}) — skipping`);
        await finish(true);
    }

    group('live resting');
    await expectField('#trickPlayBar.isLive', true);
    await expectField('#VideoPlayer.state', 'playing');

    group('OK reveals the chrome -> trackbar focused by default');
    await press(Key.Ok);
    await expectField('#Chrome.opacity', 1);
    await expectField('#VideoPlayer.state', 'playing'); // reveal doesn't pause
    await expectField('#trickPlayBar.focused', true);

    group('on the bar, OK toggles the HUD without pausing (live faithful)');
    await press(Key.Ok);
    await expectField('#Chrome.opacity', 0);
    await expectField('#VideoPlayer.state', 'playing');

    group('Rewind enters the live-DVR ladder (soft — needs a DVR window)');
    await press(Key.Rewind);
    await expectSoft('#trickPlayBar.transportMode', (v) => v === Mode.liveDvr, 'rewind -> liveDvr');
    await expectSoft('#trickPlayBar.glyph', (v) => v !== Glyph.none, 'rewind glyph present');
    await expectSoft('#bifDisplay.visible', (v) => v === true, 'bif shows in liveDvr');

    group('OK commits the ladder back to idle');
    await press(Key.Ok);
    await expectField('#trickPlayBar.transportMode', Mode.idle);

    // Pause a live stream, let the edge run on, resume -> you're behind the edge, so the badge swaps "● LIVE" for
    // the time-behind offset. The brain drops off the edge the moment the device reports the user pause
    // (pausing live IS falling behind); the offset reads out once the post-resume duration catch-up lands.
    // Soft: needs a real DVR/pause window and a few seconds of wall clock.
    group('pause -> resume drops off the live edge and shows the offset (soft — needs DVR window)');
    await waitFor('#VideoPlayer.state', (v) => v === 'playing', 'settle the commit-to-live seek before pausing');
    const durBefore = Number(await field('#VideoPlayer.duration'));
    // verified toggle: a single ECP Play can land out of phase (eaten/raced), inverting every check after it.
    const waitState = async (want: string, ms: number) => {
        const t0 = Date.now();
        while (Date.now() - t0 < ms) {
            if ((await field('#VideoPlayer.state')) === want) return true;
            await frames(250);
        }
        return false;
    };
    let paused = false;
    for (let i = 0; i < 2 && !paused; i++) {
        await press(Key.Play); // the play/pause key (on the bar, OK only toggles chrome)
        paused = await waitState('paused', 4000);
    }
    if (!paused) {
        console.log('  ⚠ soft: the live pause never landed (stream/keypress) — skipping the fall-behind checks');
    } else {
        await frames(10000); // let the live edge advance well past the frozen position
        let playing = false;
        for (let i = 0; i < 2 && !playing; i++) {
            await press(Key.Play);
            playing = await waitState('playing', 5000);
        }
        // duration FREEZES while paused and catches up a few seconds AFTER resume; the bar only receives the
        // projection on reveal — so wait for the catch-up BEFORE revealing (reading earlier races it).
        await waitFor('#VideoPlayer.duration', (v) => Number(v) > durBefore + 8, 'the post-resume edge catch-up landed', 15000);
        await press(Key.Ok); // reveal so the bar fields get pushed
        await frames(2500); // the forceLiveBadge reveal-hold (1.6s) releases
        await expectSoft('#trickPlayBar.atLiveEdge', (v) => v === false, 'fell behind the edge after pause');
        await expectSoft('#trickPlayBar.liveOffsetMs', (v) => v > 4000, 'shows a non-trivial time-behind offset');
    }

    await finish();
})();
