// This plugin converts json5 and yaml files to json files 

import {
    CompilerPlugin,
    ProvideFileEvent,
} from 'brighterscript';
import json5 from 'json5';
import YAML from "yaml";

const jsonExtensions = ['.json', '.jsonc', '.json5'];
const yamlExtensions = ['.yaml', '.yml'];

export class JsonYamlPlugin implements CompilerPlugin {
    public name = 'JsonYamlPlugin';

    provideFile(event: ProvideFileEvent) {
        if (jsonExtensions.includes(event.srcExtension)) {
            this.handleJson(event);
        } else if (yamlExtensions.includes(event.srcExtension)) {
            this.handleYaml(event);
        }
    }

    handleJson(event: ProvideFileEvent) {
        let contents = event.data.value.toString();
        const json = json5.parse(contents);
        contents = JSON.stringify(json);

        const file = event.fileFactory.AssetFile({
            srcPath: event.srcPath,
            destPath: event.destPath,
            data: contents,
        });

        event.files.push(file);
    }

    handleYaml(event: ProvideFileEvent) {
        let contents = event.data.value.toString();
        const yaml = YAML.parse(contents);
        contents = JSON.stringify(yaml);

        const file = event.fileFactory.AssetFile({
            srcPath: event.srcPath,
            destPath: event.destPath,
            data: contents,
        });

        event.files.push(file);
    }
}

export default () => {
    return new JsonYamlPlugin();
};
