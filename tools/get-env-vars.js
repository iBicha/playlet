const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '../.env');

function getEnvVars() {
    let envVars = process.env;
    if (fs.existsSync(envFile)) {
        const envConfig = dotenv.parse(fs.readFileSync(envFile));
        envVars = { ...envVars, ...envConfig };
    }

    return envVars;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = getEnvVars;
}

if (typeof exports !== 'undefined') {
    exports.getEnvVars = getEnvVars;
}
