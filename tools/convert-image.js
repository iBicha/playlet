// Description: Converts SVGs to PNGs and resizes them to the correct dimensions. 

const { ArgumentParser } = require('argparse')
const { convertFile } = require('convert-svg-to-png');

(async () => {
    const parser = new ArgumentParser({
        description: 'Sync Youtube profile with Invidious'
    });

    parser.add_argument('--input', { help: 'Input file path' });
    parser.add_argument('--options', { help: 'Options as json string' });

    const args = parser.parse_args()
    const input = args.input
    const options = JSON.parse(args.options)

    await convertFile(input, options);
})();
