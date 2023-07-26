// This plugin converts json5 and yaml files to json files 

import {
    CompilerPlugin, FileObj, ProgramBuilder, util,
} from 'brighterscript';
import path from 'path';
import fs from 'fs-extra'
import json5 from 'json5';
import YAML from "yaml";

const jsonExtensions = ['.json', '.jsonc', '.json5'];
const yamlExtensions = ['.yaml', '.yml'];

export class JsonYamlPlugin implements CompilerPlugin {
    public name = 'JsonYamlPlugin';

    afterPrepublish(builder: ProgramBuilder, files: FileObj[]) {
        const jsonFiles = files
            .filter((file) => jsonExtensions.includes(path.extname(file.dest)))
            .map((file) => path.join(builder.options.stagingDir!, file.dest));

        const yamlFiles = files
            .filter((file) => yamlExtensions.includes(path.extname(file.dest)))
            .map((file) => path.join(builder.options.stagingDir!, file.dest));

        jsonFiles.forEach((filePath) => {
            let contents = fs.readFileSync(filePath, 'utf8');
            const json = json5.parse(contents);
            contents = JSON.stringify(json);
            fs.writeFileSync(filePath, contents);
        });

        yamlFiles.forEach((filePath) => {
            let contents = fs.readFileSync(filePath, 'utf8');
            const yaml = YAML.parse(contents);
            contents = JSON.stringify(yaml);
            fs.writeFileSync(filePath, contents);
        });
    }
}

export default () => {
    return new JsonYamlPlugin();
};
