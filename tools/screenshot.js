// Description: Take a screenshot of the Roku device

const { ArgumentParser } = require('argparse')
const rokuDeploy = require('roku-deploy');
const fs = require('fs');
const getEnvVars = require('./get-env-vars');

function getArgumentParser() {
    const parser = new ArgumentParser({
        description: 'Take a screenshot of the Roku device'
    });

    parser.add_argument('filename', { help: 'Path where the screenshot will be saved (without extension)' });

    return parser;
}

const parser = getArgumentParser();
const args = parser.parse_args()
const filename = args.filename;

const config = getEnvVars();

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
        throw error;
    }
})();
