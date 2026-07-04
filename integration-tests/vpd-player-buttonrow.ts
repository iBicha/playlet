// VideoPlayerDev two-tier focus e2e: on reveal, the trackbar is focused by default (Left/Right seek, OK
// pauses immediately, no extra navigation needed); Up moves focus to the button row, Down returns to the
// trackbar, Left/Right move between buttons while the row holds focus.
//
//   cd references/playlet-legacy && npx tsx ./integration-tests/vpd-player-buttonrow.ts

import { Key, Button, Mode, press, launchVod, finish, group, expectField, expectPred, expectMediaState, waitFor } from './vpd-player-harness';

const CONTENT_ID = 'jNQXAC9IVRw'; // "Me at the zoo"

(async () => {
    await launchVod(CONTENT_ID);

    group('OK reveals chrome -> trackbar focused by default (two-tier focus)');
    await press(Key.Ok);
    await expectField('#buttonRow.visible', true);
    await expectField('#buttonRow.transportMode', Mode.idle);
    await expectField('#buttonRow.rowFocused', false);
    await expectField('#PlayPauseButton.focused', false);
    await expectField('#trickPlayBar.focused', true);

    group('Right seeks immediately from the default trackbar focus (no navigation needed)');
    await press(Key.Right);
    await expectField('#trickPlayBar.transportMode', Mode.scrub);
    await press(Key.Ok); // commit the scrub
    await expectField('#trickPlayBar.transportMode', Mode.idle);

    group('Up -> focus the button row (play/pause); Left/Right move between buttons (clamped)');
    // two Ups, not one: a commit always hides the chrome, so the first Up only re-reveals (landing back
    // on the bar, the default) and the second moves up to the buttons.
    await press(Key.Up);
    await press(Key.Up);
    await expectField('#buttonRow.rowFocused', true);
    await expectField('#buttonRow.focusedIndex', Button.playPause);
    await expectField('#PlayPauseButton.focused', true);
    await expectField('#trickPlayBar.focused', false);
    await press(Key.Right);
    await expectField('#buttonRow.focusedIndex', Button.minimize);
    await expectField('#MinimizeButton.focused', true);
    await expectField('#PlayPauseButton.focused', false);
    await press(Key.Right);
    await expectField('#buttonRow.focusedIndex', Button.minimize); // clamp, no wrap
    await press(Key.Left);
    await expectField('#buttonRow.focusedIndex', Button.playPause);

    group('Down -> back to the trackbar (cursor grows); Up -> back to play/pause');
    await press(Key.Down); // buttons -> bar, or a no-op re-reveal onto the bar (same result either way)
    await expectField('#buttonRow.rowFocused', false);
    await expectField('#trickPlayBar.focused', true);
    await expectField('#VideoPlayer.state', 'playing'); // Down no longer minimizes — playback untouched
    // doubled defensively: if the 5s auto-hide fired between round trips, the first Up only re-reveals
    // onto the bar; either way the second lands on the buttons (a harmless nudge if the first already did).
    await press(Key.Up);
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
    await press(Key.Ok); // reveal -> trackbar focused by default
    await waitFor('#trickPlayBar.focused', (v) => v === true, 'trackbar focused on reveal');
    await press(Key.Up); // -> buttons tier, play/pause (doubled defensively, as above)
    await press(Key.Up);
    await press(Key.Right);
    await expectField('#buttonRow.focusedIndex', Button.minimize);
    await press(Key.Ok); // activate -> PiP shrink (width 1280 -> 426, ~0.3s)
    await expectPred('#VideoPlayer.width', (w) => w > 0 && w < 1000, 'player shrank to the PiP window');
    await expectField('#Chrome.opacity', 0);
    await expectField('#buttonRow.rowFocused', false);

    await finish();
})();
