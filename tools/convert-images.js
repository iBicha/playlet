// Description: Converts SVGs to PNGs and resizes them to the correct dimensions. 

const { ArgumentParser, BooleanOptionalAction } = require('argparse')
const { globSync } = require('glob');
const { convertFile } = require('convert-svg-to-png');
const { existsSync, writeFileSync, readFileSync } = require('fs');
const json5 = require('json5');
const md5 = require('crypto-js/md5');
const path = require('path');
const { executablePath } = require('puppeteer');

const META_EXT = '.meta.json5';

(async () => {
    const parser = new ArgumentParser({
        description: 'Converts SVGs to PNGs'
    });

    parser.add_argument('--force', { help: 'Force convert all images', action: BooleanOptionalAction, default: false });

    const args = parser.parse_args()
    const force = args.force

    const svgFiles = findSvgFiles();

    console.log(`Found ${svgFiles.length} SVG files`);

    for (const svgFile of svgFiles) {
        const metafile = `${svgFile.file}${META_EXT}`;
        if (!existsSync(metafile)) {
            createDefaultMetaFile(svgFile, metafile);
        }

        const meta = json5.parse(readFileSync(metafile, 'utf8'));

        await generateImages(svgFile, meta, metafile, force);
    }

    console.log('Done.');
})();

function findSvgFiles() {
    return [
        ...findSvgFilesForProject('playlet-app/src'),
        ...findSvgFilesForProject('playlet-lib/src')
    ];
}

function findSvgFilesForProject(project) {
    return globSync(`**/*.svg`, { cwd: project })
        // Web app can use svg files, no need to convert
        .filter(file => !file.startsWith('www'))
        .map(file => path.join(project, file))
        .map(file => { return { file: file, rootDir: project } });
}

function createDefaultMetaFile(svgFile, metafile) {
    const meta = {
        inputHash: '',
        outputs: [{
            outputFilePath: svgFile.file.replace(`${svgFile.rootDir}/`, '').replace('.svg', '.png'),
            outputHash: '',
            width: 64,
            height: 64,
        }]
    }

    writeFileSync(metafile, json5.stringify(meta, null, 2));
}

async function generateImages(svgFile, meta, metafile, force) {
    let metaChanged = false;
    const inputHash = checkFileHash(svgFile.file, meta.inputHash);
    if (!inputHash.valid) {
        meta.inputHash = inputHash.hash;
        metaChanged = true;
    }

    for (var i in meta.outputs) {
        const output = meta.outputs[i];

        const outputFilePath = path.join(svgFile.rootDir, output.outputFilePath);
        let outputHash = checkFileHash(outputFilePath, output.outputHash);

        if (inputHash.valid && outputHash.valid && !force) {
            continue;
        }

        await generateImage(svgFile.file, output, svgFile.rootDir);
        outputHash = checkFileHash(outputFilePath, output.outputHash);

        console.log(`Generated ${outputFilePath} (${output.width}x${output.height})`);

        output.outputHash = outputHash.hash;
        metaChanged = true;
    }

    if (metaChanged) {
        writeFileSync(metafile, json5.stringify(meta, null, 2));
        console.log(`Updated ${metafile}`);
    }
}

function checkFileHash(file, hash) {
    if (!existsSync(file)) {
        return {
            valid: false,
            hash: ''
        }
    }

    const outputHash = md5(readFileSync(file, 'binary')).toString();
    return {
        valid: outputHash === hash,
        hash: outputHash
    }
}

async function generateImage(inputImage, options, rootDir) {
    const opts = {
        launch: { executablePath },
        ...options
    };
    opts.outputFilePath = path.join(rootDir, opts.outputFilePath);
    await convertFile(inputImage, opts);
}