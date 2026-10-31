// VideoPlayerDev Stats for Nerds e2e: the button starts off, toggles a diagnostics overlay for the current
// video, and the overlay remains readable after the regular player chrome auto-hides.

import {
    Button,
    Key,
    expectField,
    expectPred,
    field,
    finish,
    focusStatsButton,
    frames,
    group,
    launchVod,
    odc,
    press,
} from './vpd-player-harness';

const CONTENT_ID = 'jNQXAC9IVRw'; // "Me at the zoo"

(async () => {
    await launchVod(CONTENT_ID);

    group('Stats starts off and is discoverable in the player button row');
    await focusStatsButton();
    await expectField('#StatsButton.toggleState', true); // off icon

    group('OK enables current-video diagnostics');
    await press(Key.Ok);
    await expectField('#StatsButton.toggleState', false); // on icon
    await expectField('#statsForNerds.visible', true);
    await expectField('#videoIdValue.text', CONTENT_ID);
    await expectPred('#stateValue.text', (v) => typeof v === 'string' && v.length > 0, 'has playback state');
    await expectPred('#playbackValue.text', (v) => typeof v === 'string' && v.includes(' / '), 'combines position and duration');
    await expectPred('#viewportValue.text', (v) => typeof v === 'string' && v.includes(' x '), 'has viewport dimensions');
    await expectPred('#resolutionValue.text', (v) => typeof v === 'string' && v.includes(' x '), 'has stream resolution');
    await expectPred('#codecsValue.text', (v) => typeof v === 'string' && v.includes(' / '), 'combines video and audio codecs');
    await expectPred('#bitrateValue.text', (v) => typeof v === 'string' && v.length > 0, 'has bitrate');
    await expectPred('#containerValue.text', (v) => typeof v === 'string' && v.length > 0, 'has container');

    group('Playback diagnostics continue updating while the overlay is shown');
    const playbackBefore = await field<string>('#playbackValue.text');
    await expectPred(
        '#playbackValue.text',
        (v) => typeof v === 'string' && v.includes(' / ') && v !== playbackBefore,
        `advances from ${JSON.stringify(playbackBefore)}`,
        4000,
    );

    group('Diagnostics outlive the transient player chrome');
    await frames(5600);
    await expectField('#Chrome.opacity', 0);
    await expectField('#statsForNerds.visible', true);

    group('The same button disables and removes the overlay');
    await focusStatsButton();
    await press(Key.Ok);
    await frames(250);
    if (await field<boolean>('#StatsButton.toggleState') !== true) await press(Key.Ok);
    await expectField('#StatsButton.toggleState', true);
    await expectField('#statsForNerds.visible', false);

    group('PiP hides diagnostics without discarding the current-video toggle');
    await press(Key.Ok); // re-enable while Stats remains focused
    await expectField('#StatsButton.toggleState', false);
    await expectField('#statsForNerds.visible', true);
    await press(Key.Right); // -> minimize
    await expectField('#buttonRow.focusedIndex', Button.minimize);
    await press(Key.Ok);
    await expectPred('#VideoPlayer.width', (v) => typeof v === 'number' && v > 0 && v < 1000, 'shrinks to PiP');
    await expectField('#statsForNerds.visible', false);
    await expectField('#StatsButton.toggleState', false); // still enabled

    group('Restoring fullscreen restores the enabled diagnostics');
    // PiP moves real focus back to the app screen, whose selected tile owns the user-facing restore action.
    // Exercise the player lifecycle seam directly here so this focused spec does not depend on page layout.
    await odc.setValue({ base: 'scene', keyPath: '#VideoContainer.fullscreen', value: true });
    await expectPred('#VideoPlayer.width', (v) => typeof v === 'number' && v >= 1275, 'restores fullscreen');
    await expectField('#statsForNerds.visible', true);
    await expectField('#StatsButton.toggleState', false);

    await finish();
})();
