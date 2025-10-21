const fs = require('fs-extra');

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
    console.error('Usage: node tools/mkdir.js <dir1> [dir2] ...');
    process.exit(1);
}

dirs.forEach(dir => fs.ensureDirSync(dir));