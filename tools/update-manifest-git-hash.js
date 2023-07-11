// Description: Updates the git commit hash in the manifest files.
// It will update both Playlet and Playlet-lib manifest files.
// It will abort if there are any changes in the working directory.

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

["playlet-app/src/manifest", "playlet-lib/src/manifest"].forEach(function (manifestPath) {
    let appManifestContent = fs.readFileSync(manifestPath, { encoding: 'utf8', flag: 'r' });

    const gitHashPattern = /git_commit_sha=(\w+)/;

    appManifestContent = appManifestContent.replace(gitHashPattern, `git_commit_sha=${gitCommitHash}`);

    fs.writeFileSync(manifestPath, appManifestContent);
})
