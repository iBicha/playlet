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
import { PluginXmlFile } from './Classes/PluginXmlFile';
import { type } from 'os';

type PendingFile = {
    missing: Set<string>;
    fileContent: string;
}

export class ComponentIncludesPlugin implements CompilerPlugin {
    public name = 'ComponentIncludesPlugin';

    private pendingFiles: { [key: string]: PendingFile } = {};

    private debugProcessedFiles: Set<string> = new Set();

    afterScopeCreate(scope: Scope) {
        if (!isXmlScope(scope)) {
            return;
        }

        this.processFile(scope.xmlFile);
    }

    processFile(file: XmlFile) {
        const program = file.program;
        program.logger.info(this.name, 'Processing file: ' + file.pkgPath);

        const component = file.parser.ast.component;
        const includes = this.getIncludes(component);

        if (includes.length === 0) {
            if (this.debugProcessedFiles.has(file.pkgPath)) {
                this.debugProcessedFiles.delete(file.pkgPath);
                program.logger.info(this.name, 'Processed file: ' + file.pkgPath);
            }
            this.processMissingFiles(file);
            return;
        }

        const { scopes, missing } = this.getIncludedScopes(file.program, includes);

        if (missing.length > 0) {
            program.logger.info(this.name, 'PendingFiles file: ' + file.pkgPath, 'Missing: ' + missing.join(', '));

            this.pendingFiles[file.pkgPath] = {
                missing: new Set(missing),
                fileContent: file.fileContents,
            };
            // We remove the file entirely to prevent it from being validated.
            // We will add it back once all the missing includes are ready.
            program.removeFile(file.pkgPath);
            return;
        }

        const newFileContent = this.generateXmlFile(file, scopes);
        if (!newFileContent) {
            return;
        }
        if (this.pendingFiles[file.pkgPath]) {
            delete this.pendingFiles[file.pkgPath];
        }
        this.debugProcessedFiles.add(file.pkgPath);
        program.setFile(file.pkgPath, newFileContent);
    }

    processMissingFiles(currentFile: XmlFile) {
        const componentName = currentFile.componentName.text;
        if (!componentName) {
            return;
        }

        for (const filePath in this.pendingFiles) {
            if (this.pendingFiles[filePath].missing.has(componentName)) {
                this.pendingFiles[filePath].missing.delete(componentName);
            }

            if (this.pendingFiles[filePath].missing.size === 0) {
                const pendingFile = this.pendingFiles[filePath];
                delete this.pendingFiles[filePath];

                currentFile.program.setFile(filePath, pendingFile.fileContent);
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

    generateXmlFile(file: XmlFile, scopes: XmlScope[]): string | undefined {
        let mainXml = new PluginXmlFile(file);
        mainXml.parse();
        if (!mainXml.parsed || !mainXml.parsed.component) {
            return undefined;
        }

        for (let i = 0; i < scopes.length; i++) {
            const scope = scopes[i];

            const { scripts, fields, functions, children } = this.getIncludeItems(scope.xmlFile);

            mainXml.addScripts(scripts);
            mainXml.addFields(fields);
            mainXml.addFunctions(functions);
            if (children.length > 0) {
                mainXml.addChildren(scope.xmlFile);
            }
        }

        delete mainXml!.parsed.component.$.includes

        return mainXml.stringify();
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
