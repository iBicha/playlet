// Restarts the Roku app

const { ArgumentParser } = require('argparse');
const getEnvVars = require('./get-env-vars');

const config = getEnvVars(['ROKU_DEV_TARGET']);

(async () => {
    const parser = new ArgumentParser({
        description: 'Restart Roku app using ECP'
    });

    parser.add_argument('--app-id', { help: 'App Id' });

    const args = parser.parse_args();
    const appId = args.app_id

    const url = `http://${config.ROKU_DEV_TARGET}:8060/launch/${appId}?restart=true`;
    console.log("Restarting app", appId);
    await fetch(url, {
        method: 'POST',
        body: '',
    });
})();
