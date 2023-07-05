const dotenv = require('dotenv');
const fs = require('fs');

function getEnvVars() {
    let envVars = process.env;
    if (fs.existsSync('.vscode/.env')) {
        const envConfig = dotenv.parse(fs.readFileSync('.vscode/.env'));
        envVars = { ...envVars, ...envConfig };
    }
        
    return envVars;
}

module.exports = getEnvVars;
