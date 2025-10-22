// Description: Deploys a test app to a Roku device and waits for it to finish
// This will log the test report to the console and throw an error if the tests fail

const { ArgumentParser, BooleanOptionalAction } = require('argparse')
const getEnvVars = require('./get-env-vars');
const rokuDeploy = require('roku-deploy');
const path = require('path');
const fs = require('fs');
const { Telnet } = require('telnet-client');

function getArgumentParser() {
    const parser = new ArgumentParser({
        description: 'Deploy a test app and wait for it to finish'
    });

    parser.add_argument('--package', { help: 'Path to zip file', required: true });
    parser.add_argument('--timeout', { help: 'Timeout in seconds', type: 'int', default: 120 });
    parser.add_argument('--report-only', { help: 'Only log the test report', action: BooleanOptionalAction, default: true });

    return parser;
}

process.on('SIGINT', () => {
    process.exit(1); // Exit on Ctrl+C
});
process.on('SIGUSR1', () => {
    process.exit(1); // Exit on SIGUSR1
});
process.on('SIGUSR2', () => {
    process.exit(1); // Exit on SIGUSR2
});
process.on('uncaughtException', (error, origin) => {
    console.error(error);
    process.exit(1); // Exit on uncaught exceptions
});

(async () => {
    let success = false;
    let telnet;
    try {
        const config = getEnvVars(['ROKU_DEV_TARGET', 'ROKU_DEVPASSWORD']);

        const parser = getArgumentParser()
        const args = parser.parse_args()

        const packagePath = args.package
        const timeout = args.timeout
        const reportOnly = args.report_only
        const outputFile = replaceFileExtension(packagePath, 'txt')

        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }

        const packageFile = path.basename(packagePath)
        const packageFolder = path.dirname(packagePath)

        const options = {
            host: config.ROKU_DEV_TARGET,
            packagePort: config.ROKU_DEV_TARGET_PORT || 80,
            telnetPort: config.ROKU_DEV_TARGET_TELNET_PORT || 8085,
            password: config.ROKU_DEVPASSWORD,
            outDir: packageFolder,
            outFile: packageFile,
            failOnCompileError: true,
        }

        try {
            console.log('Deleting installed channel');
            await rokuDeploy.deleteInstalledChannel(options);
        } catch (error) {
            // ignored
        }

        console.log('Starting telnet client');
        telnet = await startTelnetClientAsync(options.host, options.telnetPort);

        console.log('Publishing package');
        await rokuDeploy.publish(options);

        console.log('Waiting for test to finish');
        let data = await readFromTelnetUntil(telnet, timeout);

        if (reportOnly) {
            data = parseTestReport(data);
        }

        fs.writeFileSync(outputFile, data);

        success = data.includes('RESULT: Success');
    }
    catch (error) {
        console.error(error);
    }
    finally {
        telnet?.end();
    }
    if (success) {
        console.log('Tests passed!');
    } else {
        console.error('Tests failed!');
    }
    process.exit(success ? 0 : 1);
})();

function startTelnetClientAsync(host, port, timeoutSeconds = 2) {
    return new Promise(async (resolve, reject) => {
        const connection = new Telnet();

        const params = {
            host: host,
            port: port,
            negotiationMandatory: false,
            timeout: timeoutSeconds * 1000
        };

        connection.on('close', function () {
            console.log('connection closed');
        });

        connection.on('error', function (error) {
            console.error('telnet connection error:', error);
            reject(error);
        });

        try {
            await connection.connect(params);
            resolve(connection);
        } catch (error) {
            reject(error);
        }
    });
}

function readFromTelnetUntil(connection, timeoutSeconds = 20, endToken = 'AppExitComplete') {
    return new Promise((resolve, reject) => {
        let data = '';

        let timeoutID;

        function timeoutReached() {
            reject(`Timeout of ${timeoutSeconds} seconds waiting for ${endToken}`);
            connection.end();
        }

        connection.on('data', (chunk) => {
            process.stdout.write(chunk.toString());
            clearTimeout(timeoutID);

            data += chunk.toString();
            if (data.includes(endToken)) {
                resolve(data);
                connection.end();
                return;
            }
            timeoutID = setTimeout(timeoutReached, timeoutSeconds * 1000);
        });

        timeoutID = setTimeout(timeoutReached, timeoutSeconds * 1000);
    });
}

function parseTestReport(input, startString = '[START TEST REPORT]', endString = '[END TEST REPORT]') {
    const start = input.indexOf(startString);
    const end = input.indexOf(endString, start + 1);

    if (start >= 0 && end >= 0) {
        return input.substring(start, end + endString.length);
    } else {
        return input;
    }
}

function replaceFileExtension(filePath, ext) {
    const directoryPath = path.dirname(filePath);
    const extension = path.extname(filePath);

    const baseFileName = path.basename(filePath, extension);
    const newFilePath = path.join(directoryPath, `${baseFileName}.${ext}`);

    return newFilePath;
}