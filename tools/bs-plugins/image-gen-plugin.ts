// This plugin converts svg files to png/jpeg files 

import {
    CompilerPlugin, ProgramBuilder,
} from 'brighterscript';
import { readFileSync, renameSync, rmSync, writeFileSync } from 'fs';
import { existsSync } from 'fs-extra';
import { globSync } from 'glob';
import md5 from 'crypto-js/md5';
import { join as joinPath, relative as relativePath } from 'path';
import json5 from 'json5';
const shell = require('shelljs');

const META_EXT = '.meta.json5';

export class ImageGenPlugin implements CompilerPlugin {
    public name = 'ImageGenPlugin';

    beforeProgramCreate(builder: ProgramBuilder) {
        const rootDir = builder.options.rootDir!;

        const svgFiles = globSync(`**/*.svg`, { cwd: rootDir });

        svgFiles.forEach((svg) => {
            // Web app can use svg files, no need to convert
            if (svg.includes('www')) {
                return;
            }

            const svgFile = relativePath(process.cwd(), joinPath(rootDir, svg));
            const metafile = `${svgFile}${META_EXT}`;
            if (!existsSync(metafile)) {
                this.createDefaultMetaFile(svgFile, metafile);
            }

            const meta = json5.parse(readFileSync(metafile, 'utf8'));

            this.generateImages(svgFile, meta, metafile);
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

    generateImages(svgFile: string, meta: any, metafile: string) {
        let metaChanged = false;
        const inputHash = this.checkFileHash(svgFile, meta.inputHash);
        if (!inputHash.valid) {
            meta.inputHash = inputHash.hash;
            metaChanged = true;
        }

        for (var i in meta.outputs) {
            const output = meta.outputs[i];

            let outputHash = this.checkFileHash(output.outputFilePath, output.outputHash);

            if (inputHash.valid && outputHash.valid) {
                continue;
            }

            this.generateImage(svgFile, output);
            outputHash = this.checkFileHash(output.outputFilePath, output.outputHash);

            output.outputHash = outputHash.hash;
            metaChanged = true;
        }

        if (metaChanged) {
            writeFileSync(metafile, json5.stringify(meta, null, 2));
        }
    }

    generateImage(svgFile: string, output: any) {
        shell.exec(`node ../tools/convert-image.js --input "${svgFile}" --options '${JSON.stringify(output)}'`)
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
