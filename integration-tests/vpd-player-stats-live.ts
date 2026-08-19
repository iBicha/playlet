// Stats for Nerds on a real live stream. Unlike the transport live spec, this is a feature-proof test:
// an unavailable/non-live fixture is a hard failure, not a passing skip, because otherwise none of the live
// diagnostics assertions would have run.

import {
    Button,
    Key,
    check,
    expectField,
    expectPred,
    field,
    finish,
    frames,
    group,
    launch,
    press,
} from './vpd-player-harness';
import { getLiveVideoId } from './live-id';

async function focusStatsButton(): Promise<void> {
    if (await field<boolean>('#buttonRow.rowFocused') !== true) {
        if (await field<boolean>('#trickPlayBar.focused') !== true) {
            await press(Key.Ok); // reveal -> trackbar
            await frames(150);
        }
        await expectField('#trickPlayBar.focused', true);
        await press(Key.Up);
        await frames(150);
        if (await field<boolean>('#buttonRow.rowFocused') !== true) await press(Key.Up);
    }
    await expectField('#buttonRow.rowFocused', true);
    // The row remembers its last-focused button. Clamp to the left edge first so repeated visits are deterministic.
    await press(Key.Left);
    await press(Key.Left);
    await press(Key.Right);
    await expectField('#buttonRow.focusedIndex', Button.stats);
    await expectField('#StatsButton.focused', true);
}

function timestampSeconds(value: string): number | undefined {
    const parts = value.split(':').map(Number);
    if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) return undefined;
    return parts.reduce((total, part) => total * 60 + part, 0);
}

function playbackTimes(value: unknown): { position: number; duration: number } | undefined {
    if (typeof value !== 'string') return undefined;
    const parts = value.split(' / ');
    if (parts.length !== 2) return undefined;
    const position = timestampSeconds(parts[0]);
    const duration = timestampSeconds(parts[1]);
    if (position === undefined || duration === undefined) return undefined;
    return { position, duration };
}

(async () => {
    const liveId = process.env.PLAYER_LIVE_ID || (await getLiveVideoId()) || 'jfKfPfyJRdk';
    console.log(`live stats id: ${liveId}`);

    const playing = await launch(liveId, 45_000);
    check('live fixture starts playing', playing, liveId);
    if (!playing) await finish();

    const isLive = await field<boolean>('#trickPlayBar.isLive');
    check('fixture is live', isLive === true, `id=${liveId} isLive=${isLive}`);
    if (isLive !== true) await finish();

    group('Live Stats starts off and can be enabled from the button row');
    await focusStatsButton();
    await expectField('#StatsButton.toggleState', true);
    await press(Key.Ok);
    await expectField('#StatsButton.toggleState', false);
    await expectField('#statsBg.visible', true);

    group('Live diagnostics identify the stream and expose decoder facts');
    await expectField('#line1Value.text', liveId);
    await expectField('#line2Value.text', 'playing');
    await expectPred('#line4Value.text', (v) => typeof v === 'string' && v.includes(' x '), 'has viewport dimensions');
    await expectPred('#line5Value.text', (v) => typeof v === 'string' && v.includes(' x '), 'has stream resolution', 10_000);
    await expectPred('#line6Value.text', (v) => typeof v === 'string' && v.includes(' / '), 'has video and audio codecs', 10_000);
    await expectPred('#line7Value.text', (v) => typeof v === 'string' && v.length > 0, 'has bitrate', 10_000);
    await expectPred('#line8Value.text', (v) => typeof v === 'string' && v.length > 0, 'has container', 10_000);

    group('Live playback reports a moving position and live-edge duration');
    const playbackBefore = await field<string>('#line3Value.text');
    const timesBefore = playbackTimes(playbackBefore);
    check(
        'live playback has position / duration',
        timesBefore !== undefined && timesBefore.duration > 0 && timesBefore.position <= timesBefore.duration,
        playbackBefore,
    );
    await expectPred(
        '#line3Value.text',
        (value) => {
            const times = playbackTimes(value);
            return times !== undefined
                && times.duration > 0
                && times.position <= times.duration
                && value !== playbackBefore;
        },
        `advances from ${JSON.stringify(playbackBefore)}`,
        6000,
    );

    group('Live Stats can be disabled without changing playback');
    await focusStatsButton();
    await press(Key.Ok);
    await frames(250);
    if (await field<boolean>('#StatsButton.toggleState') !== true) await press(Key.Ok);
    await expectField('#StatsButton.toggleState', true);
    await expectField('#statsBg.visible', false);
    await expectField('#VideoPlayer.state', 'playing');

    await finish();
})();
