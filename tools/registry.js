// Description: Read, write and delete registry.

const fs = require('fs');
const { ArgumentParser, BooleanOptionalAction } = require('argparse');
const getEnvVars = require('./get-env-vars');

(async () => {
    const parser = new ArgumentParser({
        description: 'Manage registry'
    });

    parser.add_argument('--input', { help: 'Input file path, for importing to Roku device' });
    parser.add_argument('--output', { help: 'Output file path, for exporting from Roku device' });
    parser.add_argument('--clear', { help: 'Clear registry', action: BooleanOptionalAction, default: false });

    const args = parser.parse_args();
    const input = args.input;
    const output = args.output;
    const clear = args.clear;

    // only one action can be specified at a time between input, output and clear
    const actions = [input, output, clear].filter(Boolean);
    if (actions.length !== 1) {
        console.error('Only one (and exactly one) action can be specified at a time between --input, --output and --clear');
        process.exit(1);
    }

    const config = getEnvVars(['ROKU_DEV_TARGET']);

    const playletServer = `http://${config.ROKU_DEV_TARGET}:8888/debug/registry`;

    if (input) {
        const registry = JSON.parse(fs.readFileSync(input, { encoding: 'utf8', flag: 'r' }));

        for (const section in registry) {
            for (const key in registry[section]) {
                registry[section][key] = JSON.stringify(registry[section][key]);
            }
        }

        const response = await fetch(playletServer, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registry),
        });

        if (!response.ok) {
            throw new Error(`Failed to write registry: ${response.status} ${response.statusText}`);
        }
    }
    else if (output) {
        if (fs.existsSync(output)) {
            throw new Error(`File "${output}" already exists`);
        }
        const response = await fetch(playletServer);

        if (!response.ok) {
            throw new Error(`Failed to read registry: ${response.status} ${response.statusText}`);
        }

        const registry = await response.json();

        for (const section in registry) {
            for (const key in registry[section]) {
                try {
                    registry[section][key] = JSON.parse(registry[section][key]);
                } catch (error) {
                    console.error(`Failed to parse value for key "${key}" in section "${section}"`);
                }
            }
        }

        fs.writeFileSync(output, JSON.stringify(registry, null, 4));
    }
    else if (clear) {
        const response = await fetch(playletServer, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to clear registry: ${response.status} ${response.statusText}`);
        }
    }
    else {
        console.error('No action specified');
        process.exit(1);
    }
})();
