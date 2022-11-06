const path = require('path');
const fs = require('fs');
const semverParse = require('semver/functions/parse')

const packageJsonContent = fs.readFileSync("./package.json", {encoding:'utf8', flag:'r'})
const packageJson = JSON.parse(packageJsonContent)

const version = packageJson.version
const parsedVersion = semverParse(version)

let appManifestContent = fs.readFileSync("./src/manifest", {encoding:'utf8', flag:'r'})

const majorPattern = /major_version=(\d+)/
const minorPattern = /minor_version=(\d+)/
const buildPattern = /build_version=(\d+)/

appManifestContent = appManifestContent.replace(majorPattern, `major_version=${parsedVersion.major}`)
appManifestContent = appManifestContent.replace(minorPattern, `minor_version=${parsedVersion.minor}`)
appManifestContent = appManifestContent.replace(buildPattern, `build_version=${String(parsedVersion.patch).padStart(5, '0')}`)

fs.writeFileSync("./src/manifest", appManifestContent)