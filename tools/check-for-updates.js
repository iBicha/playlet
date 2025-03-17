// Check for updates on Roku device

const rokuTestAutomation = require('roku-test-automation');
const ecp = rokuTestAutomation.ecp;
const utils = rokuTestAutomation.utils;
const Key = rokuTestAutomation.ECP.Key;

const getEnvVars = require('./get-env-vars');

const config = getEnvVars(['ROKU_DEV_TARGET']);

(async () => {
    utils.setupEnvironmentFromConfig({
        RokuDevice: {
            devices: [{
                host: config.ROKU_DEV_TARGET,
                password: ''
            }]
        }
    });

    // Go to the home screen
    await ecp.sendKeypress(Key.Home);
    await utils.sleep(2000);
    await ecp.sendKeypress(Key.Home);
    await utils.sleep(2000);

    // Settings menu
    await ecp.sendKeypress(Key.Up);
    await utils.sleep(500);
    await ecp.sendKeypress(Key.Right);
    await utils.sleep(500);

    // System
    await ecp.sendKeypress(Key.Up);
    await utils.sleep(500);
    await ecp.sendKeypress(Key.Right);
    await utils.sleep(500);

    // Software update
    await ecp.sendKeypress(Key.Up);
    await utils.sleep(500);
    await ecp.sendKeypress(Key.Up);
    await utils.sleep(500);
    await ecp.sendKeypress(Key.Up);
    await utils.sleep(500);
    await ecp.sendKeypress(Key.Right);
    await utils.sleep(2000);

    // Check for updates
    await ecp.sendKeypress(Key.Ok);
    await utils.sleep(500);
})();
