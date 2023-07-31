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

export class ComponentIncludesPlugin implements CompilerPlugin {
    public name = 'ComponentIncludesPlugin';

    private pendingFiles: { [key: string]: Set<string> } = {};

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

            this.pendingFiles[file.pkgPath] = new Set(missing);
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
