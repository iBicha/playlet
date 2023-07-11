
const { ArgumentParser } = require('argparse')
const { BooleanOptionalAction } = require('argparse');
const getEnvVars = require('./get-env-vars');
const rokuDeploy = require('roku-deploy');
const path = require('path');
const spawn = require('child_process').spawn;

function getArgumentParser() {
    const parser = new ArgumentParser({
        description: 'Deploy a test app and wait for it to finish'
    });

    parser.add_argument('--package', { help: 'Path to zip file', required: true });
    parser.add_argument('--timeout', { help: 'Timeout in seconds', type: 'int', default: 900 });
    parser.add_argument('--report-only', { help: 'Only log the test report', action: BooleanOptionalAction, default: true });

    return parser;
}

(async () => {
    let success = false;
    let telnet;
    try {
        const config = getEnvVars();

        const parser = getArgumentParser()
        const args = parser.parse_args()

        packagePath = args.package
        timeout = args.timeout
        reportOnly = args.report_only

        const packageFile = path.basename(packagePath)
        const packageFolder = path.dirname(packagePath)

        const options = {
            host: config.ROKU_DEV_TARGET,
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
        telnet = await startTelnetProcessAsync(options.host);

        console.log('Publishing package');
        await rokuDeploy.publish(options);

        console.log('Waiting for test to finish');
        let data = await readFromProcessUntil(telnet);

        if (reportOnly) {
            data = parseTestReport(data);
        }

        console.log(data);

        success = data.includes('RESULT: Success');
    }
    catch (error) {
        console.error(error);
    }
    finally {
        telnet?.kill();
    }
    if (!success) {
        throw new Error('Tests failed');
    }
})();

function startTelnetProcessAsync(host, port = 8085, timeoutSeconds = 2) {
    return new Promise((resolve, reject) => {
        const telnet = spawn('telnet', [host, port]);

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

function readFromProcessUntil(process, endToken = 'AppExitComplete', timeoutSeconds = 10) {
    return new Promise((resolve, reject) => {
        let data = '';

        let timeoutID;

        function timeoutReached() {
            reject(`Timeout of ${timeoutSeconds} seconds waiting for ${endToken}`);
            process.kill();
        }

        process.stdout.on('data', (chunk) => {
            clearTimeout(timeoutID);
            data += chunk;
            if (data.includes(endToken)) {
                resolve(data);
                process.kill();
                return;
            }
            timeoutID = setTimeout(timeoutReached, timeoutSeconds * 1000);
        });

        process.stderr.on('data', (data) => {
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
