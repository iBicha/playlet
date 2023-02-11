const fs = require('fs');
const shell = require('shelljs');

if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}

const gitStatus = shell.exec('git status --porcelain=v1');
if (gitStatus.stdout !== '') {
    shell.echo('Found changed files. Aborting.');
    shell.exit(1);
}

const gitCommitHash =  shell.exec('git rev-parse HEAD').stdout.trim();

["playlet/src/manifest", "playlet-lib/src/manifest"].forEach(function (manifestPath) {
    let appManifestContent = fs.readFileSync(manifestPath, { encoding: 'utf8', flag: 'r' });

    const gitHashPattern = /git_commit_sha=(\w+)/;

    appManifestContent = appManifestContent.replace(gitHashPattern, `git_commit_sha=${gitCommitHash}`);

    fs.writeFileSync(manifestPath, appManifestContent);
})
