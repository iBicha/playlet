const shell = require('shelljs');
const { ArgumentParser } = require('argparse')

if (!shell.which('unzip')) {
    shell.echo('Sorry, this script requires unzip');
    shell.exit(1);
}

if (!shell.which('mksquashfs')) {
    shell.echo('Sorry, this script requires mksquashfs');
    shell.exit(1);
}

const parser = new ArgumentParser({
    description: 'Convert a zip file to a squashfs file'
});

parser.add_argument('--in-file', { help: 'A zip file to squash' });
parser.add_argument('--out-file', { help: 'A squashfs file to create' });

const args = parser.parse_args();

const inFile = args.in_file;
const outFile = args.out_file;

const fs = require('fs');

const { execSync } = require('child_process');

// Create a temporary directory
const tempDir = fs.mkdtempSync('squash-fs-');

// Unzip the file
execSync(`unzip ${inFile} -d ${tempDir}`);

execSync(`mksquashfs ${tempDir} ${outFile} -force-uid 500 -force-gid 500 -comp zstd -b 32768 -Xcompression-level 22`);

// Remove the temporary directory
execSync(`rm -rf ${tempDir}`);

console.log(`Created squashfs file: ${outFile}`);