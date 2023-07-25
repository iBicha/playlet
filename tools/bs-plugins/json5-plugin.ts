// This plugin converts json5 files to json files 

import {
    CompilerPlugin, FileObj, ProgramBuilder, util,
} from 'brighterscript';
import path from 'path';
import fs from 'fs-extra'
import json5 from 'json5';

const jsonExtensions = ['.json', '.jsonc', '.json5'];

export class Json5Plugin implements CompilerPlugin {
    public name = 'Json5Plugin';

    afterPrepublish(builder: ProgramBuilder, files: FileObj[]) {
        const jsonFiles = files
            .filter((file) => jsonExtensions.includes(path.extname(file.dest)))
            .map((file) => path.join(builder.options.stagingDir!, file.dest));

        jsonFiles.forEach((filePath) => {
            let contents = fs.readFileSync(filePath, 'utf8');
            const json = json5.parse(contents);
            contents = JSON.stringify(json);
            fs.writeFileSync(filePath, contents);
        });
    }
}

export default () => {
    return new Json5Plugin();
};
