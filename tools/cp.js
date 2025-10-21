const fs = require('fs-extra');

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
    console.error('Usage: node tools/cp.js <source> <destination>');
    process.exit(1);
}

fs.copySync(src, dest, { overwrite: true });