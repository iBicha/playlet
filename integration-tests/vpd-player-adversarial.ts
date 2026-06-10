// VideoPlayerDev adversarial e2e: drive rapid / edge-case transport sequences and assert the device-seam
// invariants after EVERY input (pressChecked) — a transport never leaves the video "playing", and the bif is up
// iff a transport is active. The broad regression net for "impossible states".
//
//   cd references/playlet-legacy && npx tsx ./integration-tests/vpd-player-adversarial.ts

import { Key, odc, launchVod, finish, group, pressChecked, assertPlayerInvariants } from './vpd-player-harness';

const CONTENT_ID = 'aqz-KE-bpKQ'; // Big Buck Bunny — 10min, has storyboards

(async () => {
    await launchVod(CONTENT_ID);
    await assertPlayerInvariants('resting');

    group('self-heal guard fires: force an out-of-band resume under a transport');
    await pressChecked(Key.Left, 'scrub-for-guard');
    // Force the Video to PLAY while the brain is still scrubbing (the out-of-band auto-resume a SponsorBlock seek
    // causes). The guard MUST catch it and re-pause; assertPlayerInvariants polls ~2.5s, so this passes only if it did.
    await odc.setValue({ base: 'scene', keyPath: '#VideoPlayer.control', value: 'resume' });
    await assertPlayerInvariants('guard re-freezes a resume-under-scrub');
    await pressChecked(Key.Ok, 'commit-after-guard');

    group('reveal, then rapid scrub<->scan mode flips');
    await pressChecked(Key.Ok, 'reveal');
    await pressChecked(Key.Left, 'scrub');
    await pressChecked(Key.Rewind, 'scrub->scan-rev');
    await pressChecked(Key.Forward, 'scan-flip-fwd');
    await pressChecked(Key.Left, 'scan->scrub');
    await pressChecked(Key.Ok, 'commit');

    group('commit then immediate re-scrub (the bug-pattern shape, minus SponsorBlock)');
    await pressChecked(Key.Left, 'scrub2');
    await pressChecked(Key.Ok, 'commit2');
    await pressChecked(Key.Left, 'rescrub-right-after-commit');
    await pressChecked(Key.Right, 'scrub-step');
    await pressChecked(Key.Ok, 'commit3');

    group('replay spam from idle + from a transport');
    await pressChecked(Key.Replay, 'replay1');
    await pressChecked(Key.Replay, 'replay2');
    await pressChecked(Key.Left, 'scrub-after-replay');
    await pressChecked(Key.Replay, 'replay-from-scrub');
    await pressChecked(Key.Ok, 'settle');

    group('double-OK + scan-to-scrub');
    await pressChecked(Key.Rewind, 'scan');
    await pressChecked(Key.Ok, 'commit-scan');
    await pressChecked(Key.Ok, 'second-ok-idle');
    await pressChecked(Key.Forward, 'scan2');
    await pressChecked(Key.Left, 'scan-to-scrub');
    await pressChecked(Key.Ok, 'final-commit');

    group('two-tier focus: buttons <-> bar, scrub from the bar');
    await pressChecked(Key.Ok, 'reveal-buttons-focus');
    await pressChecked(Key.Down, 'focus-bar');
    await pressChecked(Key.Up, 'focus-buttons');
    await pressChecked(Key.Down, 'focus-bar-2');
    await pressChecked(Key.Left, 'scrub-from-bar');
    await pressChecked(Key.Ok, 'commit-from-bar');

    await finish();
})();
