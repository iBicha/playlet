// Description: Converts SVGs to PNGs (optionally framed as 9-patches) and resizes them to the correct dimensions.

const { ArgumentParser, BooleanOptionalAction } = require('argparse')
const { globSync } = require('glob');
const { convert, convertFile } = require('convert-svg-to-png');
const { existsSync, writeFileSync, readFileSync } = require('fs');
const json5 = require('json5');
const md5 = require('crypto-js/md5');
const path = require('path');

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

        const border = output.ninePatch ? 2 : 0;
        console.log(`Generated ${outputFilePath} (${output.width + border}x${output.height + border})`);

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
        launch: { channel: 'chrome' },
        ...options
    };
    opts.outputFilePath = path.join(rootDir, opts.outputFilePath);
    if (opts.ninePatch) {
        await generateNinePatch(inputImage, opts);
        return;
    }
    await convertFile(inputImage, opts);
}

// ninePatch: { stretchX: [start, end], stretchY: [start, end] } in content pixels, end exclusive. The file
// is width+2 x height+2: top/left markers span the stretchable region, bottom/right the content region (the
// same spans). display:block — the converter inlines the SVG in <body>, where a canvas shorter than the line
// box would sit on the text baseline and render shifted down.
async function generateNinePatch(inputImage, opts) {
    const { width, height, ninePatch, outputFilePath, outputHash, ...convertOptions } = opts;
    const [x0, x1] = ninePatch.stretchX;
    const [y0, y1] = ninePatch.stretchY;
    const validSpan = (start, end, size) => Number.isInteger(start) && Number.isInteger(end) && 0 <= start && start < end && end <= size;
    if (!Number.isInteger(width) || !Number.isInteger(height) || !validSpan(x0, x1, width) || !validSpan(y0, y1, height)) {
        throw new Error(`${inputImage}: invalid ninePatch ${JSON.stringify(ninePatch)} for ${width}x${height}`);
    }
    if (convertOptions.scale !== undefined && convertOptions.scale !== 1) {
        throw new Error(`${inputImage}: a 9-patch must render at scale 1 (its markers are 1px)`);
    }
    const content = readFileSync(inputImage).toString('base64');
    const marker = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000"/>`;
    const framed = `<svg xmlns="http://www.w3.org/2000/svg" width="${width + 2}" height="${height + 2}" shape-rendering="crispEdges" style="display:block">`
        + `<image href="data:image/svg+xml;base64,${content}" x="1" y="1" width="${width}" height="${height}" preserveAspectRatio="none"/>`
        + marker(1 + x0, 0, x1 - x0, 1) + marker(0, 1 + y0, 1, y1 - y0)
        + marker(1 + x0, height + 1, x1 - x0, 1) + marker(width + 1, 1 + y0, 1, y1 - y0)
        + '</svg>';
    const png = await convert(framed, { ...convertOptions, width: width + 2, height: height + 2 });
    writeFileSync(outputFilePath, png);
}