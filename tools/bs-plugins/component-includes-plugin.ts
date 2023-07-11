// Plugin to allow including other components in a component

import {
    BeforeFileTranspileEvent,
    CompilerPlugin,
    XmlFile,
    isXmlFile,
    util,
} from 'brighterscript';
import { SGChildren, SGComponent, SGField, SGFunction, SGInterface, SGNode, SGScript } from 'brighterscript/dist/parser/SGTypes';

export class ComponentIncludesPlugin implements CompilerPlugin {
    public name = 'ComponentIncludesPlugin';

    private processedXmlFiles: { [key: string]: boolean } = {};

    beforeFileTranspile(event: BeforeFileTranspileEvent) {
        if (!isXmlFile(event.file)) {
            return;
        }

        this.processXmlFile(event.file);
    }

    processXmlFile(xmlFile: XmlFile) {
        if (this.processedXmlFiles[xmlFile.srcPath]) {
            return;
        }

        this.processedXmlFiles[xmlFile.srcPath] = true;

        const program = xmlFile.program;
        const component = xmlFile.parser.ast.component;

        if (!component || !component.attributes) {
            return;
        }

        const includes = this.getIncludes(component);
        if (includes.length === 0) {
            return;
        }

        for (let i = 0; i < includes.length; i++) {
            const include = includes[i];
            const includeXmlFile = program.getComponent(include).file;

            this.processXmlFile(includeXmlFile);

            const { scripts, fields, functions, children } = this.getIncludeItems(includeXmlFile);

            if (scripts) {
                component.scripts.push(...scripts);
            }

            if (fields || functions) {
                if (!component.api) {
                    component.api = new SGInterface();
                }
            }

            if (fields) {
                component.api.fields.push(...fields);
            }

            if (functions) {
                component.api.functions.push(...functions);
            }

            if (children) {
                if (!component.children) {
                    component.children = new SGChildren();
                }

                component.children.children.push(...children);
            }
        }

        component.attributes = component.attributes.filter((attr) => {
            return attr.key.text !== 'includes';
        });
    }

    getIncludes(component: SGComponent) {
        return component.attributes.filter((attr) => {
            return attr.key.text === 'includes';
        }).map((attr) => {
            return attr.value.text.split(',').map((item) => {
                return item.trim();
            });
        }).flat();
    }

    getIncludeItems(xmlFile: XmlFile) {
        let fields: SGField[] = [];
        let functions: SGFunction[] = [];
        let children: SGNode[] = [];
        let scripts: SGScript[] = [];

        const component = xmlFile.parser.ast.component;
        if (!component) {
            return { fields, functions, children, scripts };
        }

        const scriptImports = xmlFile.getAvailableScriptImports();
        scripts = scriptImports.map((scriptImport) => {
            const script = new SGScript();
            script.uri = util.getRokuPkgPath(scriptImport);
            return script;
        });

        if (component.api) {
            fields = component.api.fields;
            functions = component.api.functions;
        }

        if (component.children) {
            children = component.children.children;
        }

        return {
            scripts,
            fields,
            functions,
            children,
        }
    }
}

export default () => {
    return new ComponentIncludesPlugin();
};
