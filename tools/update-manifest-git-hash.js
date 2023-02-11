var shell = require('shelljs');

if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}

const gitStatus = shell.exec('git status --porcelain=v1');
if (gitStatus.stdout !== '') {
    shell.echo('Found changed files. Aborting.');
    shell.exit(1);
}

shell.echo('All Good!');
