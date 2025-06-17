// Restarts the Roku app

const { ArgumentParser } = require('argparse');
const getEnvVars = require('./get-env-vars');

const config = getEnvVars(['ROKU_DEV_TARGET']);

(async () => {
    const parser = new ArgumentParser({
        description: 'Restart Roku app using ECP'
    });

    parser.add_argument('--app-id', { help: 'App Id' });
    parser.add_argument('--query', { help: 'Query parameters to append to the URL' });

    const args = parser.parse_args();
    let appId = args.app_id || "dev";
    const query = args.query || "";

    if (appId === "prod") {
        appId = "693751";
    }

    let url = `http://${config.ROKU_DEV_TARGET}:8060/launch/${appId}?restart=true`;
    if (query) {
        url += `&${query}`;
    }
    console.log("Restarting app", appId);
    await fetch(url, {
        method: 'POST',
        body: '',
    });
})();
