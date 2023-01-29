const rokuDeploy = require('roku-deploy');
const dotenv = require('dotenv');
const fs = require('fs');
const { exit } = require('process');

if(process.argv.length !== 3) {
    console.error("Invalid usage! usage: npm run screenshot -- filename");
    exit(-1);
}

const filename = process.argv[2];
const config = dotenv.parse(fs.readFileSync('.vscode/.env'));

const options = {
    host: config.ROKU_DEV_TARGET,
    password: config.ROKU_DEVPASSWORD,
    outDir: '.',
    outFile: filename
};

(async () => {
    try {
        await rokuDeploy.takeScreenshot(options);
        console.log(`${filename} created`);
    }
    catch (error) {
        console.error(error);
    }
})();
