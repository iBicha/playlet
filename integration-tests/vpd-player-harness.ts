// Shared helpers for the VideoPlayerDev on-device e2e specs: each spec deep-links a video, drives the device
// over rta ecp/odc, asserts on ODC field reads, and exits non-zero on failure.
//
// Read `#Chrome.opacity` (1 shown / 0 hidden), not `.visible` — visible stays true mid-fade-out. Read
// `#spinner.mode` (0 none / 1 loading / 2 buffering), not `#spinner.visible` — that id collides with the inner
// BusySpinner and the Group's visible is always true.

import { ecp, odc } from 'roku-test-automation';
import { AppId, setupEnvironment } from './common';
import { Key } from 'roku-test-automation/client/dist/ECP';

export { Key, ecp, odc };

// Mirror the BrightScript enums the renderers project.
export const Mode = { idle: 0, scrub: 1, scan: 2, liveDvr: 3 } as const;
export const Glyph = { none: 0, replay: 9 } as const;
export const Button = { playPause: 0, minimize: 1 } as const;

const j = (v: unknown) => JSON.stringify(v);
const eq = (a: unknown, b: unknown) => j(a) === j(b);

let failures: string[] = [];
let soft: string[] = [];
let section = '';

export function group(name: string): void {
    section = name;
    console.log(`\n── ${name} ──`);
}

function record(ok: boolean, msg: string, isSoft = false): void {
    console.log(`  ${ok ? '✓' : isSoft ? '⚠ soft' : '✗ FAIL'} ${msg}`);
    if (!ok) (isSoft ? soft : failures).push(`[${section}] ${msg}`);
}

export async function field<T = unknown>(keyPath: string): Promise<T | undefined> {
    const res = await odc.getValue({ base: 'scene', keyPath });
    return res?.value as T | undefined;
}

// The player retries a failed stream URL once, so a single transient state="error" is expected to recover. A
// second episode, or one that never clears within 8s, is an unrecovered failure — abort the suite.
let errorEpisodes = 0, inError = false, firstErrorAt = 0;
async function fatalErrorTripwire(): Promise<void> {
    let st: string | undefined;
    try { st = await field<string>('#VideoPlayer.state'); } catch { return; }
    if (st === 'error') {
        if (!inError) { inError = true; errorEpisodes++; firstErrorAt = Date.now(); }
        if (errorEpisodes >= 2 || Date.now() - firstErrorAt > 8000) {
            throw new Error(`FATAL: unrecovered video error (episodes=${errorEpisodes}) — the player's one retry did not recover (e.g. 403 with no working stream URL). Aborting the suite.`);
        }
    } else {
        inError = false;
    }
}

async function settle(keyPath: string, pred: (v: unknown) => boolean, timeoutMs: number): Promise<unknown> {
    const start = Date.now();
    let v = await field(keyPath);
    while (!pred(v) && Date.now() - start < timeoutMs) {
        await fatalErrorTripwire();
        await ecp.sleep(120);
        v = await field(keyPath);
    }
    return v;
}

export async function expectField(keyPath: string, expected: unknown, timeoutMs = 4000): Promise<void> {
    const got = await settle(keyPath, (v) => eq(v, expected), timeoutMs);
    record(eq(got, expected), `${keyPath} = ${j(got)}${eq(got, expected) ? '' : ` (expected ${j(expected)})`}`);
}

export async function expectPred(keyPath: string, pred: (v: any) => boolean, descr: string, timeoutMs = 4000): Promise<void> {
    const got = await settle(keyPath, pred, timeoutMs);
    record(pred(got), `${keyPath} ${descr} (got ${j(got)})`);
}

// Soft variant: a miss is a warning, not a failure — for racy signals (the ~700ms replay glyph) and
// live-stream-dependent checks.
export async function expectSoft(keyPath: string, pred: (v: any) => boolean, descr: string, timeoutMs = 1500): Promise<void> {
    const got = await settle(keyPath, pred, timeoutMs);
    record(pred(got), `${keyPath} ${descr} (got ${j(got)})`, true);
}

export async function expectMediaState(expected: string, timeoutMs = 8000): Promise<void> {
    const start = Date.now();
    let last: string | undefined;
    while (Date.now() - start < timeoutMs) {
        last = (await ecp.getMediaPlayer()).state;
        if (last === expected) break;
        await ecp.sleep(250);
    }
    record(last === expected, `ecp media state = ${last}${last === expected ? '' : ` (expected ${expected})`}`);
}

export function check(label: string, ok: boolean, detail?: unknown): void {
    record(ok, `${label}${detail === undefined ? '' : ` (${typeof detail === 'string' ? detail : j(detail)})`}`);
}

export async function press(key: Key): Promise<void> {
    await ecp.sendKeypress(key);
}

// A fixed wait for a visual transition with no field oracle — named so it's auditable. Prefer waitFor().
export async function frames(ms = 200): Promise<void> {
    await ecp.sleep(ms);
}

export async function waitFor(keyPath: string, pred: (v: any) => boolean, descr: string, timeoutMs = 4000): Promise<void> {
    const got = await settle(keyPath, pred, timeoutMs);
    record(pred(got), `waitFor ${keyPath} ${descr} (got ${j(got)})`);
}

// Device-seam invariants read from the live node tree. Polls briefly so the self-heal guard (re-pauses on the
// next position tick) and chrome fades settle — assert the steady state, not a mid-transition blip.
export async function assertPlayerInvariants(label: string): Promise<void> {
    const inTransport = (m: number | undefined) => m === Mode.scrub || m === Mode.scan || m === Mode.liveDvr;
    let mode = await field<number>('#trickPlayBar.transportMode');
    let state = await field<string>('#VideoPlayer.state');
    const start = Date.now();
    while (inTransport(mode) && state === 'playing' && Date.now() - start < 2500) {
        await ecp.sleep(200);
        mode = await field<number>('#trickPlayBar.transportMode');
        state = await field<string>('#VideoPlayer.state');
    }
    const bif = await field<boolean>('#bifDisplay.visible');
    // a transport freezes the video (never "playing" under one); the bif is visible iff a transport is active.
    check(`INV-D1 @ ${label}`, !(inTransport(mode) && state === 'playing'), `mode=${mode} state=${state}`);
    check(`INV-D2 @ ${label}`, bif === inTransport(mode), `bif=${bif} mode=${mode}`);
    // the button row is visible iff idle (it rides the Chrome group's fade for actual paint).
    const rowVisible = await field<boolean>('#buttonRow.visible');
    check(`INV-D3 @ ${label}`, rowVisible === (mode === Mode.idle), `rowVisible=${rowVisible} mode=${mode}`);
    const rowFocused = await field<boolean>('#buttonRow.rowFocused');
    const opacity = await field<number>('#Chrome.opacity');
    // the button row is focusable only at idle; nothing is focused while the chrome is hidden.
    check(`INV-D4 @ ${label}`, !rowFocused || mode === Mode.idle, `rowFocused=${rowFocused} mode=${mode}`);
    check(`INV-D5 @ ${label}`, opacity !== 0 || !rowFocused, `opacity=${opacity} rowFocused=${rowFocused}`);
}

// press + assert the whole invariant set (rapid adversarial sequences have no single per-key oracle). The paced
// wait lets the deferred freeze land after a commit-seek settles before the strict check.
export async function pressChecked(key: Key, label: string): Promise<void> {
    await press(key);
    await frames(600);
    await assertPlayerInvariants(label);
}

// Hard-fail if #VideoPlayer is the stock player, not VideoPlayerDev (chosen at compile time by USE_DEV_PLAYER),
// so a wrong-build run can't masquerade as a pass.
export async function assertPlayerIsDev(): Promise<void> {
    const isDev = await odc.isSubtype({ base: 'scene', keyPath: '#VideoPlayer', subtype: 'VideoPlayerDev' });
    if (!isDev) {
        console.log('\nFAILED: #VideoPlayer is not a VideoPlayerDev. Build the lib with `#const USE_DEV_PLAYER = true` (VideoQueue.bs) before running the player suite.');
        await ecp.sendKeypress(Key.Home);
        process.exit(1);
    }
    console.log('  player node subtype: VideoPlayerDev ✓');
}

// Hard-fail unless the device's EFFECTIVE SponsorBlock config matches the sbskip fixture: enabled +
// notifications + outro=manual_skip (the shipped defaults from config/preferences.json5; user_prefs overrides
// them). With SponsorBlock off the sbskip spec would exercise a plain OK/Right from idle and pass vacuously.
export async function assertSponsorBlockFixture(): Promise<void> {
    let prefs: Record<string, any> = {};
    try {
        const { values } = await odc.readRegistry({});
        prefs = JSON.parse((values as any)?.Playlet?.user_prefs ?? '{}');
    } catch {
        /* no overrides -> the defaults apply */
    }
    const enabled = prefs['sponsorblock.enabled'] ?? true;
    const notifications = prefs['sponsorblock.show_notifications'] ?? true;
    const outro = prefs['sponsorblock.categories']?.outro?.option ?? 'manual_skip';
    if (enabled !== true || notifications !== true || outro !== 'manual_skip') {
        console.log(`\nFAILED: SponsorBlock fixture not met (enabled=${enabled} notifications=${notifications} outro=${outro}).`);
        console.log('  The sbskip spec needs sponsorblock.enabled=true, show_notifications=true and the outro');
        console.log('  category on manual_skip (the defaults) — clear the Playlet/user_prefs overrides or fix them in Settings.');
        await ecp.sendKeypress(Key.Home);
        process.exit(1);
    }
    console.log('  SponsorBlock fixture: enabled + notifications + outro=manual_skip ✓');
}

// Deep-link a video and wait for playback. Polls #VideoPlayer.state (the player node can appear late — live
// manifests take ~20s). Returns false if it never reaches "playing" (e.g. an offline live id).
export async function launch(contentId: string, timeoutMs = 30_000): Promise<boolean> {
    setupEnvironment(AppId.DEV);
    console.log(`launch: contentId=${contentId}`);
    await ecp.sendLaunchChannel({ params: { contentId } });
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        let state: string | undefined;
        try {
            state = await field<string>('#VideoPlayer.state');
        } catch {
            state = undefined;
        }
        if (state === 'playing') {
            await assertPlayerIsDev();
            return true;
        }
        if (state === 'error') {
            console.log('  player entered state=error');
            return false;
        }
        await ecp.sleep(500);
    }
    console.log('  player did not reach state=playing within timeout');
    return false;
}

// Deep-link a known-good VOD and hard-fail if it never plays (a real failure, not a skip).
export async function launchVod(contentId: string): Promise<void> {
    const playing = await launch(contentId);
    if (!playing) {
        console.log(`\nFAILED: known-good VOD ${contentId} never reached "playing" — a real failure, not a skip.`);
        await ecp.sendKeypress(Key.Home);
        process.exit(1);
    }
}

// Tear down (Home) and exit non-zero on any hard failure; skipped=true (precondition not met) reports as a pass.
export async function finish(skipped = false): Promise<never> {
    try {
        await odc.shutdown();
    } catch {
        /* odc may not be connected */
    }
    await ecp.sendKeypress(Key.Home);
    if (soft.length) {
        console.log(`\n${soft.length} soft warning(s):`);
        soft.forEach((s) => console.log(`  ⚠ ${s}`));
    }
    if (skipped) {
        console.log('\nSKIPPED (precondition not met) — treated as pass.');
        process.exit(0);
    }
    if (failures.length) {
        console.log(`\nFAILED — ${failures.length} assertion(s):`);
        failures.forEach((f) => console.log(`  ✗ ${f}`));
        process.exit(1);
    }
    console.log('\nPASSED ✓');
    process.exit(0);
}
