const rokuDeploy = require('roku-deploy');
const dotenv = require('dotenv')
const fs = require('fs');
const { exit } = require('process');

if(process.argv.length !== 3) {
    console.error("Invalid usage! usage: npm run screenshot -- filename")
    exit(-1)
}

const filename = process.argv[2]
const config = dotenv.parse(fs.readFileSync('.vscode/.env'))

rokuDeploy.takeScreenshot({
    host: config.ROKU_DEV_TARGET,
    password: config.ROKU_DEVPASSWORD,
    outDir: '.',
    outFile: filename
}).then(function(filename){
    console.log(`${filename} created`)
}, function(error) {
    console.error(error);
});