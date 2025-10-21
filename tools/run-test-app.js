// Description: Deploys a test app to a Roku device and waits for it to finish
// This will log the test report to the console and throw an error if the tests fail

const { ArgumentParser, BooleanOptionalAction } = require('argparse')
const getEnvVars = require('./get-env-vars');
const rokuDeploy = require('roku-deploy');
const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const shell = require('shelljs');

if (!shell.which('telnet')) {
    throw new Error('The telnet command is not available. Please install a telnet client and make sure it is in your PATH.');
}

function getArgumentParser() {
    const parser = new ArgumentParser({
        description: 'Deploy a test app and wait for it to finish'
    });

    parser.add_argument('--package', { help: 'Path to zip file', required: true });
    parser.add_argument('--timeout', { help: 'Timeout in seconds', type: 'int', default: 120 });
    parser.add_argument('--report-only', { help: 'Only log the test report', action: BooleanOptionalAction, default: true });

    return parser;
}

const childProcesses = [];

function processCleanup() {
    childProcesses.forEach(function (child) {
        try {
            child.kill();
        } catch (error) {

        }
    });
}

function exitHandler(options, exitCode) {
    if (options.cleanup) {
        processCleanup();
    }
    if (options.exit) {
        process.exit(exitCode);
    }
}

process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));


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

        console.log('Starting telnet process');
        telnet = await startTelnetProcessAsync(options.host, options.telnetPort);

        console.log('Publishing package');
        await rokuDeploy.publish(options);

        console.log('Waiting for test to finish');
        let data = await readFromProcessUntil(telnet, timeout);

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
        telnet?.kill();
    }
    if (success) {
        console.log('Tests passed!');
    } else {
        console.error('Tests failed!');
    }
    process.exit(success ? 0 : 1);
})();

function startTelnetProcessAsync(host, port, timeoutSeconds = 2) {
    return new Promise((resolve, reject) => {
        const telnet = spawn('telnet', [host, port]);
        childProcesses.push(telnet);

        let timeoutID;
        function timeoutReached() {
            resolve(telnet);
        }

        telnet.stdout.on('data', (data) => {
            clearTimeout(timeoutID);
            timeoutID = setTimeout(timeoutReached, timeoutSeconds * 1000);
        });

        telnet.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            reject()
        })

        timeoutID = setTimeout(timeoutReached, timeoutSeconds * 1000);
    });
}

function readFromProcessUntil(proc, timeoutSeconds = 20, endToken = 'AppExitComplete') {
    return new Promise((resolve, reject) => {
        let data = '';

        let timeoutID;

        function timeoutReached() {
            reject(`Timeout of ${timeoutSeconds} seconds waiting for ${endToken}`);
            proc.kill();
        }

        proc.stdout.on('data', (chunk) => {
            process.stdout.write(chunk);
            clearTimeout(timeoutID);

            data += chunk;
            if (data.includes(endToken)) {
                resolve(data);
                proc.kill();
                return;
            }
            timeoutID = setTimeout(timeoutReached, timeoutSeconds * 1000);
        });

        proc.stderr.on('data', (data) => {
            clearTimeout(timeoutID);
            console.error(`stderr: ${data}`);
            reject()
        })

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