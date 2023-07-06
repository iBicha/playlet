// Description: Updates the version in the manifest files.
// Reads the version from the root package.json and updates the manifest files,
// as well as the package.json files in the playlet-web folder.

const fs = require('fs');
const { execSync } = require("child_process");

const semverParse = require('semver/functions/parse');

const packageJsonContent = fs.readFileSync("./package.json", { encoding: 'utf8', flag: 'r' });
const packageJson = JSON.parse(packageJsonContent);

const version = packageJson.version;
const parsedVersion = semverParse(version);

["playlet/src/manifest", "playlet-lib/src/manifest"].forEach(function (manifestPath) {
    let appManifestContent = fs.readFileSync(manifestPath, { encoding: 'utf8', flag: 'r' });

    const majorPattern = /major_version=(\d+)/;
    const minorPattern = /minor_version=(\d+)/;
    const buildPattern = /build_version=(\d+)/;

    appManifestContent = appManifestContent.replace(majorPattern, `major_version=${parsedVersion.major}`);
    appManifestContent = appManifestContent.replace(minorPattern, `minor_version=${parsedVersion.minor}`);
    appManifestContent = appManifestContent.replace(buildPattern, `build_version=${String(parsedVersion.patch).padStart(5, '0')}`);

    fs.writeFileSync(manifestPath, appManifestContent);
})

execSync(`npm version ${version} --allow-same-version --no-git-tag-version`);
execSync(`npm version ${version} --allow-same-version --no-git-tag-version`, { cwd: 'playlet-web' });