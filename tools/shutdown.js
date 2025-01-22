// Shutdown a Roku device
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

    await ecp.sendKeypress(Key.PowerOff);
})();
