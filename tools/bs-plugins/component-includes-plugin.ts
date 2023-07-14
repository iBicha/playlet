// Plugin to allow including other components in a component

import {
    CompilerPlugin,
    Program,
    Scope,
    XmlFile,
    XmlScope,
    isXmlScope,
    util,
} from 'brighterscript';
import { SGComponent, SGField, SGFunction, SGNode, SGScript } from 'brighterscript/dist/parser/SGTypes';
import { parseString, Builder } from 'xml2js'

export class ComponentIncludesPlugin implements CompilerPlugin {
    public name = 'ComponentIncludesPlugin';

    private pendingFiles: { [key: string]: Set<string> } = {};

    afterScopeCreate(scope: Scope) {
        if (!isXmlScope(scope)) {
            return;
        }

        this.processFile(scope.xmlFile);
    }

    processFile(file: XmlFile) {
        file.program.logger.info(this.name, 'Processing file: ' + file.pkgPath);

        const component = file.parser.ast.component;
        const includes = this.getIncludes(component);

        if (includes.length === 0) {
            this.processMissingFiles(file);
            return;
        }

        const { scopes, missing } = this.getIncludedScopes(file.program, includes);

        if (missing.length > 0) {
            file.program.logger.info(this.name, 'PendingFiles file: ' + file.pkgPath, 'Missing: ' + missing.join(', '));

            this.pendingFiles[file.pkgPath] = new Set(missing);
            return;
        }

        const newFile = this.generateXmlFile(file, scopes);
        if (!newFile) {
            return;
        }
        if (this.pendingFiles[file.pkgPath]) {
            delete this.pendingFiles[file.pkgPath];
        }
        file.program.setFile(file.pkgPath, newFile);

        this.processMissingFiles(file);
    }

    processMissingFiles(currentFile: XmlFile) {
        const componentName = currentFile.componentName.text;
        if (!componentName) {
            return;
        }

        for (const filePath in this.pendingFiles) {
            if (this.pendingFiles[filePath].has(componentName)) {
                this.pendingFiles[filePath].delete(componentName);
            }

            if (this.pendingFiles[filePath].size === 0) {
                delete this.pendingFiles[filePath];

                const pendingFile = currentFile.program.getFile(filePath) as XmlFile;
                if (pendingFile) {
                    this.processFile(pendingFile);
                }
            }
        }
    }

    getIncludes(component?: SGComponent) {
        if (!component || !component.attributes) {
            return [];
        }

        return component.attributes.filter((attr) => {
            return attr.key.text === 'includes';
        }).map((attr) => {
            return attr.value.text.split(',').map((item) => {
                return item.trim();
            });
        }).flat();
    }

    getIncludedScopes(program: Program, includes: string[]) {
        const neededScopes: XmlScope[] = [];
        const missing: string[] = [];

        for (let i = 0; i < includes.length; i++) {
            const include = includes[i];
            const scope = program.getComponentScope(include);

            if (!scope) {
                missing.push(include);
            } else {
                neededScopes.push(scope);
            }
        }

        return {
            missing,
            scopes: neededScopes,
        };
    }

    generateXmlFile(file: XmlFile, scopes: XmlScope[]): any {
        let mainXml = this.parseXmlFile(file);
        if (!mainXml || !mainXml.component) {
            return null;
        }

        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];

            const { scripts, fields, functions, children } = this.getIncludeItems(scope.xmlFile);

            this.addScripts(mainXml, scripts);
            this.addFields(mainXml, fields);
            this.addFunctions(mainXml, functions);
            this.addChildren(mainXml, children, scope.xmlFile);
        }

        delete mainXml!.component.$.includes

        const builder = new Builder();
        return builder.buildObject(mainXml);
    }

    addScripts(mainXml: any, scripts: SGScript[]) {
        if (scripts.length === 0) {
            return;
        }

        if (!mainXml.component.script) {
            mainXml.component.script = [];
        }

        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            const attributes = script.attributes.reduce((acc, attr) => {
                acc[attr.key.text] = attr.value.text;
                return acc;
            }, {} as any);
            mainXml.component.script.push({
                $: attributes,
            });
        }
    }

    addFields(mainXml: any, fields: SGField[]) {
        if (fields.length === 0) {
            return;
        }

        if (!mainXml.component.interface || mainXml.component.interface.length === 0) {
            mainXml.component.interface = [{}];
        }

        if (!mainXml.component.interface[0].field) {
            mainXml.component.interface[0].field = [];
        }

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const attributes = field.attributes.reduce((acc, attr) => {
                acc[attr.key.text] = attr.value.text;
                return acc;
            }, {} as any);
            mainXml.component.interface[0].field.push({
                $: attributes,
            });
        }
    }

    addFunctions(mainXml: any, functions: SGFunction[]) {
        if (functions.length === 0) {
            return;
        }

        if (!mainXml.component.interface || mainXml.component.interface.length === 0) {
            mainXml.component.interface = [{}];
        }

        if (!mainXml.component.interface[0].function) {
            mainXml.component.interface[0].function = [];
        }

        for (let i = 0; i < functions.length; i++) {
            const func = functions[i];
            const attributes = func.attributes.reduce((acc, attr) => {
                acc[attr.key.text] = attr.value.text;
                return acc;
            }, {} as any);
            mainXml.component.interface[0].function.push({
                $: attributes,
            });
        }
    }

    addChildren(mainXml: any, children: SGNode[], includeFile: XmlFile) {
        if (children.length === 0) {
            return;
        }

        if (!mainXml.component.children || mainXml.component.children.length === 0) {
            mainXml.component.children = [{}];
        }

        const includeXml = this.parseXmlFile(includeFile);

        if (!includeXml || !includeXml.component || !includeXml.component.children || !includeXml.component.children.length) {
            return;
        }

        const mergedChildren: { [key: string]: any } = {};
        for (let key in mainXml.component.children[0]) {
            if (Array.isArray(mainXml.component.children[0][key]) && Array.isArray(includeXml.component.children[0][key])) {
                mergedChildren[key] = includeXml.component.children[0][key].concat(mainXml.component.children[0][key]);
            } else {
                mergedChildren[key] = mainXml.component.children[0][key];
            }
        }
        for (let key in includeXml.component.children[0]) {
            if (!mergedChildren.hasOwnProperty(key)) {
                mergedChildren[key] = includeXml.component.children[0][key];
            }
        }

        mainXml.component.children[0] = mergedChildren;
    }

    parseXmlFile(file: XmlFile): any {
        let parsed;

        parseString(file.fileContents, (err, res) => {
            parsed = res;
        });

        return parsed;
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
