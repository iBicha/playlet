// Runs the VideoPlayerDev on-device integration specs (each a standalone tsx script that exits non-zero on
// failure). With no args runs them all; pass filter substrings to run a subset:
//   npm run test:integration:player -- transport     (only transport)
//   npm run test:integration:player -- live sbskip    (live + sbskip)
// Requires the lib built with `#const USE_DEV_PLAYER = true` — the specs assert #VideoPlayer is VideoPlayerDev.
import { spawnSync } from 'node:child_process';

const SPECS = ['transport', 'buttonrow', 'bif', 'adversarial', 'live', 'sbskip'];

const filters = process.argv.slice(2).map((f) => f.toLowerCase());
const selected = filters.length === 0 ? SPECS : SPECS.filter((s) => filters.some((f) => s.includes(f)));

if (selected.length === 0) {
    console.error(`No player spec matches [${filters.join(', ')}]. Available: ${SPECS.join(', ')}`);
    process.exit(2);
}

console.log(`Running player spec(s): ${selected.join(', ')}`);
const failed: string[] = [];
for (const spec of selected) {
    console.log(`\n===== player-${spec} =====`);
    const res = spawnSync('npx', ['tsx', `integration-tests/vpd-player-${spec}.ts`], { stdio: 'inherit' });
    if (res.status !== 0) failed.push(spec);
}

if (failed.length > 0) {
    console.error(`\nFAILED spec(s): ${failed.join(', ')}`);
    process.exit(1);
}
console.log(`\nAll ${selected.length} player spec(s) passed.`);
