// VideoPlayerDev VOD transport e2e: drive the transport over ECP and assert the renderer/Video state over ODC.
//
//   cd references/playlet-legacy && npx tsx ./integration-tests/vpd-player-transport.ts

import { Key, Mode, Glyph, press, launchVod, finish, group, expectField, expectPred, expectSoft, expectMediaState } from './vpd-player-harness';

const CONTENT_ID = 'jNQXAC9IVRw'; // "Me at the zoo" — short, always-available

(async () => {
    await launchVod(CONTENT_ID);

    group('resting (playing, chrome hidden)');
    await expectField('#VideoPlayer.state', 'playing');
    await expectField('#Chrome.opacity', 0);
    await expectField('#bifDisplay.visible', false);
    await expectField('#trickPlayBar.transportMode', Mode.idle);
    await expectField('#spinner.mode', 0);

    group('OK reveals chrome (playing + hidden -> reveal, no pause)');
    await press(Key.Ok);
    await expectField('#Chrome.opacity', 1);
    await expectField('#Chrome.visible', true);
    await expectField('#buttonRow.visible', true);
    await expectField('#VideoPlayer.state', 'playing');

    group('OK pauses (playing + shown -> pause + LargePause)');
    await press(Key.Ok);
    await expectMediaState('pause');
    await expectField('#VideoPlayer.state', 'paused');
    await expectPred('#largePause.phase', (v) => v > 0, 'pause poster animating', 1500);
    await expectField('#Chrome.opacity', 1); // chrome stays up on pause

    group('OK resumes (paused + shown -> resume, hide chrome)');
    await press(Key.Ok);
    await expectMediaState('play');
    await expectField('#VideoPlayer.state', 'playing');
    await expectField('#Chrome.opacity', 0);

    group('Left enters scrub (instant reveal, bif shows)');
    await press(Key.Left);
    await expectField('#trickPlayBar.transportMode', Mode.scrub);
    await expectField('#bifDisplay.transportMode', Mode.scrub);
    await expectField('#bifDisplay.visible', true);
    await expectField('#Chrome.opacity', 1);

    group('repeated Left stays scrub (no re-trigger)');
    await press(Key.Left);
    await expectField('#trickPlayBar.transportMode', Mode.scrub);
    await expectField('#bifDisplay.visible', true);

    group('OK commits scrub -> idle (bif self-hides)');
    await press(Key.Ok);
    await expectField('#trickPlayBar.transportMode', Mode.idle);
    await expectField('#bifDisplay.visible', false);
    await expectMediaState('play');

    group('Rewind enters scan ladder (glyph + bif)');
    await press(Key.Rewind);
    await expectField('#trickPlayBar.transportMode', Mode.scan);
    await expectPred('#trickPlayBar.glyph', (v) => v !== Glyph.none, 'scan glyph present');
    await expectField('#bifDisplay.visible', true);

    group('OK commits scan -> idle');
    await press(Key.Ok);
    await expectField('#trickPlayBar.transportMode', Mode.idle);
    await expectField('#bifDisplay.visible', false);

    group('InstantReplay flashes the replay glyph (transient, soft)');
    await press(Key.Replay);
    await expectSoft('#trickPlayBar.glyph', (v) => v === Glyph.replay, 'transient replay glyph', 700);
    await expectField('#Chrome.opacity', 1); // replay reveals the chrome

    await finish();
})();
