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
const gitTags = shell.exec(`git tag --contains ${gitCommitHash}`)
    .stdout.trim()
    .split('\n')
    .map(tag => tag.trim());

const expectedGitTag = `v${require('../package.json').version}`;
if (gitTags.length === 0) {
    console.error(`No git tag found. Signing anyway...`);
}
if (!gitTags.includes(expectedGitTag)) {
    console.error(`Expected git tag ${expectedGitTag} but found [${gitTags.join(",")}]. Signing anyway...`);
}

// download playlet.zip from github
const zipUrl = `https://github.com/iBicha/playlet/releases/download/${expectedGitTag}/playlet.zip`
shell.exec(`curl --fail -L -o release/playlet.zip "${zipUrl}"`);

// sign the package
shell.exec('node tools/sign-package.js');
