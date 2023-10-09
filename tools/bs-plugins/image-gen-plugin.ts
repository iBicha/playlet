// This plugin converts svg files to png/jpeg files 

import {
    CompilerPlugin, FileObj, ProgramBuilder,
} from 'brighterscript';
import { readFileSync, writeFileSync } from 'fs';
import { existsSync } from 'fs-extra';
import { globSync } from 'glob';
import md5 from 'crypto-js/md5';
import { join as joinPath } from 'path';
import json5 from 'json5';
const shell = require('shelljs');

const META_EXT = '.meta.json5';

export class ImageGenPlugin implements CompilerPlugin {
    public name = 'ImageGenPlugin';

    beforePrepublish(builder: ProgramBuilder, files: FileObj[]) {
        // Debug flag
        // @ts-ignore
        const debug = !!builder.options.debug;
        if (debug) {
            // Since the plugin does a lot of scanning of files, it is fine not to run it in debug mode
            // The change will be picked up on release
            return;
        }

        const rootDir = builder.options.rootDir!;

        const svgFiles = globSync(`**/*.svg`, { cwd: rootDir });

        svgFiles.forEach((svgFile) => {
            // Web app can use svg files, no need to convert
            if (svgFile.includes('www')) {
                return;
            }

            const metafile = joinPath(rootDir, `${svgFile}${META_EXT}`);
            if (!existsSync(metafile)) {
                this.createDefaultMetaFile(svgFile, metafile);
            }

            const meta = json5.parse(readFileSync(metafile, 'utf8'));

            this.generateImages(svgFile, meta, metafile, rootDir, files);
        });
    }

    createDefaultMetaFile(svgFile: string, metafile: string) {
        const meta = {
            inputHash: '',
            outputs: [{
                outputFilePath: svgFile.replace('.svg', '.png'),
                outputHash: '',
                width: 64,
                height: 64,
            }]
        }

        writeFileSync(metafile, json5.stringify(meta, null, 2));
    }

    generateImages(svgFile: string, meta: any, metafile: string, rootDir: string, files: FileObj[]) {
        let metaChanged = false;
        const inputHash = this.checkFileHash(joinPath(rootDir, svgFile), meta.inputHash);
        if (!inputHash.valid) {
            meta.inputHash = inputHash.hash;
            metaChanged = true;
        }

        for (var i in meta.outputs) {
            const output = meta.outputs[i];

            const outputFilePath = joinPath(rootDir, output.outputFilePath);
            let outputHash = this.checkFileHash(outputFilePath, output.outputHash);

            if (inputHash.valid && outputHash.valid) {
                continue;
            }

            this.generateImage(svgFile, output, rootDir);
            outputHash = this.checkFileHash(outputFilePath, output.outputHash);

            files.push({ src: outputFilePath, dest: output.outputFilePath })

            output.outputHash = outputHash.hash;
            metaChanged = true;
        }

        if (metaChanged) {
            writeFileSync(metafile, json5.stringify(meta, null, 2));
        }
    }

    generateImage(svgFile: string, output: any, rootDir: string) {
        shell.exec(`node ../../tools/convert-image.js --input "${svgFile}" --options '${JSON.stringify(output)}'`, {
            cwd: rootDir
        })
    }

    checkFileHash(file: string, hash: string) {
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
}

export default () => {
    return new ImageGenPlugin();
};
