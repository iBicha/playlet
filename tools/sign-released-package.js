// Description: pulls the release zip from github, signs it and retrieves it from the Roku device

const shell = require('shelljs');

if (!shell.which('git')) {
    shell.echo('Sorry, this script requires git');
    shell.exit(1);
}

shell.exec('git fetch --tags --force');

// get current commit hash
const gitCommitHash = shell.exec('git rev-parse HEAD').stdout.trim();

// get current tag
const gitTag = shell.exec(`git describe --tags ${gitCommitHash} --abbrev=0`).stdout.trim();

const expectedGitTag = `v${require('../package.json').version}`;
if (gitTag !== expectedGitTag) {
    console.error(`Expected git tag ${expectedGitTag} but found ${gitTag}. Signing anyway...`);
}

// download playlet.zip from github
const zipUrl = `https://github.com/iBicha/playlet/releases/download/${gitTag}/playlet.zip`
shell.exec(`curl -L -o release/playlet.zip "${zipUrl}"`);

// sign the package
shell.exec('node tools/sign-package.js');
