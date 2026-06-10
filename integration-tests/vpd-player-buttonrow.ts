// VideoPlayerDev two-tier focus e2e: on reveal, play/pause is focused by default; Down moves focus to the
// trackbar (its cursor grows), Up returns to the buttons, Left/Right move between buttons.
//
//   cd references/playlet-legacy && npx tsx ./integration-tests/vpd-player-buttonrow.ts

import { Key, Button, Mode, press, launchVod, finish, group, expectField, expectPred, expectMediaState, waitFor } from './vpd-player-harness';

const CONTENT_ID = 'jNQXAC9IVRw'; // "Me at the zoo"

(async () => {
    await launchVod(CONTENT_ID);

    group('OK reveals chrome -> play/pause focused by default (two-tier focus)');
    await press(Key.Ok);
    await expectField('#buttonRow.visible', true);
    await expectField('#buttonRow.transportMode', Mode.idle);
    await expectField('#buttonRow.rowFocused', true);
    await expectField('#buttonRow.focusedIndex', Button.playPause);
    await expectField('#PlayPauseButton.focused', true);
    await expectField('#trickPlayBar.focused', false);

    group('Right/Left move between buttons (clamped)');
    await press(Key.Right);
    await expectField('#buttonRow.focusedIndex', Button.minimize);
    await expectField('#MinimizeButton.focused', true);
    await expectField('#PlayPauseButton.focused', false);
    await press(Key.Right);
    await expectField('#buttonRow.focusedIndex', Button.minimize); // clamp, no wrap
    await press(Key.Left);
    await expectField('#buttonRow.focusedIndex', Button.playPause);

    group('Down -> focus the bar (cursor grows); Up -> back to play/pause');
    await press(Key.Down);
    await expectField('#buttonRow.rowFocused', false);
    await expectField('#trickPlayBar.focused', true);
    await expectField('#VideoPlayer.state', 'playing'); // Down no longer minimizes — playback untouched
    await press(Key.Up);
    await expectField('#buttonRow.rowFocused', true);
    await expectField('#buttonRow.focusedIndex', Button.playPause);
    await expectField('#trickPlayBar.focused', false);

    group('activate play/pause -> pauses (icon flips to play)');
    await press(Key.Ok);
    await expectMediaState('pause');
    await expectField('#VideoPlayer.state', 'paused');
    await expectField('#buttonRow.playing', false);
    await expectField('#PlayPauseButton.toggleState', true);
    await expectField('#buttonRow.rowFocused', true); // activating a button keeps focus on the buttons

    group('OK on play/pause resumes + hides chrome + drops focus');
    await press(Key.Ok);
    await expectMediaState('play');
    await expectField('#VideoPlayer.state', 'playing');
    await expectField('#buttonRow.rowFocused', false);
    await expectField('#Chrome.opacity', 0);

    // LAST: minimize is the only path now (Down doesn't), and PiP teardown stays at the end so it can't bleed.
    group('activate the minimize button -> the player minimizes to PiP');
    await press(Key.Ok);
    await waitFor('#buttonRow.rowFocused', (v) => v === true, 'buttons focused on reveal');
    await press(Key.Right);
    await expectField('#buttonRow.focusedIndex', Button.minimize);
    await press(Key.Ok); // activate -> PiP shrink (width 1280 -> 426, ~0.3s)
    await expectPred('#VideoPlayer.width', (w) => w > 0 && w < 1000, 'player shrank to the PiP window');
    await expectField('#Chrome.opacity', 0);
    await expectField('#buttonRow.rowFocused', false);

    await finish();
})();
