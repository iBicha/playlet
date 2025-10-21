const fs = require('fs-extra');

const targets = process.argv.slice(2);
if (targets.length === 0) {
    console.error('Usage: node tools/rm.js <target1> [target2] ...');
    process.exit(1);
}

targets.forEach(target => fs.removeSync(target));