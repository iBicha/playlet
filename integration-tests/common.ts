const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
import { utils } from 'roku-test-automation';

const envFile = path.join(__dirname, '../.env');
const config = getEnvVars(['ROKU_DEV_TARGET', 'ROKU_DEVPASSWORD']);

export function setupEnvironment() {
    utils.setupEnvironmentFromConfig({
        RokuDevice: {
            devices: [{
                host: config.ROKU_DEV_TARGET,
                password: config.ROKU_DEVPASSWORD
            }]
        },
        ECP: {
            default: {
                launchChannelId: 'dev'
            }
        },
        OnDeviceComponent: {
            logLevel: 'info'
        }
    })
}

function getEnvVars(requiredVars = undefined) {
    let envVars = process.env;
    if (fs.existsSync(envFile)) {
        const envConfig = dotenv.parse(fs.readFileSync(envFile));
        envVars = { ...envVars, ...envConfig };
    }
    if (requiredVars) {
        const missingVars = requiredVars.filter((key) => !envVars[key]);
        if (missingVars.length) {
            throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
        }
    }

    return envVars;
}

