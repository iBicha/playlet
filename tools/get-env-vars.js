// Description: an utility script to read env vars from OS or .env files

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '../.env');

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

module.exports = getEnvVars