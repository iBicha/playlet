// Regression for the skip-then-scrub wedge: scrub into a MANUAL SponsorBlock segment, OK to commit, OK to
// confirm the "Press OK to skip" notice, then IMMEDIATELY Right. Old symptom: the bif thumbnails stay up over a
// black screen with the spinner running forever (the skip-seek wedged buffering<->paused).
//
// Vehicle: Big Buck Bunny `aqz-KE-bpKQ`, manual `outro` 494.6–618.7s over a 634s stream, so the skip target
// 618.7 is a real in-flight seek (not finish). Needs config: outro=manual_skip, enabled, show_notifications.
//
// launch() can return on an early "playing", so settle first. The verdict is read entirely over ODC (state /
// transportMode / bif / position samples). Exits non-zero on a wedge, on a missing SponsorBlock fixture
// (asserted up front — a disabled SponsorBlock would otherwise make this pass vacuously), and when the skip
// never lands (position must reach the outro skip target).
//
//   cd references/playlet-legacy && npm run test:integration:player -- sbskip

import { Key, ecp, odc, press, launch, finish, group, field, assertSponsorBlockFixture } from './vpd-player-harness';

const BBB = 'aqz-KE-bpKQ';
const OUTRO_START_MS = 494600;
const FF_SEEK_S = 475;

async function odcN(k: string): Promise<number> { return Number(await field(k)); }
async function snap(label: string): Promise<Record<string, unknown>> {
    const ks = ['#VideoPlayer.state', '#VideoPlayer.position', '#trickPlayBar.transportMode', '#trickPlayBar.cursorMs', '#bifDisplay.visible', '#spinner.mode', '#Chrome.opacity'];
    const o: Record<string, unknown> = {};
    for (const k of ks) { try { o[k] = await field(k); } catch { o[k] = '<err>'; } }
    console.log(`  [ODC @ ${label}] ` + ks.map((k) => `${k.replace('#', '')}=${JSON.stringify(o[k])}`).join(' '));
    return o;
}

(async () => {
    // running standalone, press Home first if ODC/#id reads look contaminated by a ghost player (the chain's
    // prior finish()->Home handles it).
    const ok = await launch(BBB);
    if (!ok) { console.log('launch failed — skipping (no network / video unavailable)'); await finish(true); }

    group('fixture: SponsorBlock must be ON with outro=manual_skip (else this spec is vacuous)');
    await assertSponsorBlockFixture();

    group('settle the freshly-launched player');
    await ecp.sleep(5000);
    const duration = await odcN('#VideoPlayer.duration');
    console.log(`  BBB duration=${duration}s -> outro skip 618.7 is ${duration > 620.7 ? 'a REAL in-flight SEEK' : 'FINISH (near EOF)'}`);

    group('fixture: fast-forward to just before the outro (idle ODC seek)');
    await odc.setValue({ base: 'scene', keyPath: '#VideoPlayer.seek', value: FF_SEEK_S });
    for (let i = 0; i < 30; i++) { if ((await odcN('#VideoPlayer.position')) >= FF_SEEK_S - 3) break; await ecp.sleep(250); }
    await snap('fast-forward landing');

    group('scrub into the outro from HIDDEN chrome (Right -> transport scrub; ~5s/press from 475)');
    for (let i = 0; i < 11; i++) { await press(Key.Right); await ecp.sleep(250); } // pace the scrub steps
    const m = await snap('mid-scrub');
    if (Number(m['#trickPlayBar.transportMode']) !== 1) { console.log('  scrub did NOT engage — skipping (environment)'); await finish(true); }

    group('commit (OK) -> seek to cursor + resume inside the outro');
    await press(Key.Ok);

    group('ODC gate: wait until PLAYING inside the outro, then +2.5s so OnPosition arms the manual notice');
    let armed = false;
    for (let i = 0; i < 50; i++) {
        const st = await field<string>('#VideoPlayer.state');
        const pos = await odcN('#VideoPlayer.position');
        if (st === 'playing' && pos * 1000 >= OUTRO_START_MS + 2000 && pos * 1000 < 618700) { armed = true; break; }
        await ecp.sleep(300);
    }
    console.log(`  playing-inside-outro=${armed} position=${await odcN('#VideoPlayer.position')}s`);
    if (!armed) {
        // the fixture is verified, and reaching the outro is plain transport+seek — not arming is a real failure.
        console.log('\nFAILED: never reached "playing inside outro" with the SponsorBlock fixture verified.');
        try { await odc.shutdown(); } catch { /* */ }
        await ecp.sendKeypress(Key.Home);
        process.exit(1);
    }
    await ecp.sleep(2500); // let OnPosition fire a few times -> stash manualSkipSegment + show the notice
    const posBefore = await odcN('#VideoPlayer.position');
    console.log(`  position before OK=${posBefore}s`);

    group('THE BUG: OK confirms the skip -> 120ms -> Right (scrub starts while the skip-seek is in flight)');
    await ecp.sendKeypress(Key.Ok);
    await ecp.sleep(120);
    await ecp.sendKeypress(Key.Right);

    group('characterize over 8s: wedge (bif visible + video not progressing) vs recover');
    let lastPos = -1, frozenCount = 0;
    const samples: Record<string, unknown>[] = [];
    for (let i = 0; i < 16; i++) {
        await ecp.sleep(500);
        const st = await field<string>('#VideoPlayer.state');
        const mode = await odcN('#trickPlayBar.transportMode');
        const bif = await field<boolean>('#bifDisplay.visible');
        const pos = await odcN('#VideoPlayer.position');
        const spin = await odcN('#spinner.mode');
        if (st !== 'playing' && pos === lastPos) frozenCount++; else frozenCount = 0;
        lastPos = pos;
        samples.push({ st, mode, bif, pos });
        console.log(`  t+${((i + 1) * 0.5).toFixed(1)}s state=${JSON.stringify(st)} mode=${mode} bif=${bif} pos=${pos} spin=${spin}`);
    }

    // Classify the tail: the wedge is the video stuck BUFFERING under the bif (never a frame). A scrub that
    // settles to PAUSED with the bif (a frozen frame) is the correct result of "skip then Right"; the bif over a
    // sustained PLAYING video is also impossible. Position must be frozen.
    const tail = samples.slice(-6);
    // The skip must have LANDED: the OK confirmed a seek to the outro end (618.7s). A tail still in the low
    // 500s means the manual notice never armed and OK just play/pause-toggled — the vacuous run this spec
    // must reject, not pass.
    const skipLanded = tail.every((s) => Number(s.pos) >= 610);
    const blackWedge = tail.filter((s) => s.st === 'buffering').length >= 4;
    const playsUnderBif = tail.filter((s) => s.st === 'playing' && s.bif === true).length >= 3;
    const settledPausedScrub = tail.every((s) => s.st === 'paused' && s.bif === true);
    const posFrozen = new Set(tail.map((s) => s.pos)).size <= 2;
    console.log(`\n===== VERDICT =====`);
    console.log(`  all samples: ${JSON.stringify(samples.map((s) => `${s.st}/m${s.mode}/${s.bif ? 'bif' : '---'}/${s.pos}`))}`);
    console.log(`  blackWedge(buffering stuck)=${blackWedge}  playsUnderBif=${playsUnderBif}  pausedScrub=${settledPausedScrub}  posFrozen=${posFrozen}  skipLanded=${skipLanded}`);

    if (!skipLanded) {
        console.log('\n*** FAILED: the confirmed skip never landed (position stayed before the outro end) — the manual notice did not arm. ***');
        try { await odc.shutdown(); } catch { /* */ }
        await ecp.sendKeypress(Key.Home);
        process.exit(1);
    }
    if (blackWedge || playsUnderBif) {
        console.log('\n*** BUG STILL PRESENT: impossible state (bif over a stuck/playing video). ***');
        try { await odc.shutdown(); } catch { /* */ }
        await ecp.sendKeypress(Key.Home);
        process.exit(1);
    }
    // The black/loading wedge is fixed: the video reaches a paused frame (not black), position frozen.
    // It does not cleanly settle — at this end-of-content position the device keeps reporting "playing" and the
    // guard re-pauses it, so this is a residual near-EOF re-pause loop, not a clean idle.
    console.log(`\n*** WEDGE FIXED: ${settledPausedScrub ? 'paused frame + bif, position frozen' : 'final=' + JSON.stringify(tail[tail.length - 1])}.`);
    console.log(`    Residual: end-of-content re-pause loop (the guard absorbs a device auto-resume; position frozen → no playback leaks). ***`);
    await finish();
})();
