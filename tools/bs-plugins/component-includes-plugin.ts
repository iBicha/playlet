// Plugin to allow including other components in a component

import {
    AfterProvideFileEvent,
    CompilerPlugin,
    DiagnosticSeverity,
    Program,
    XmlFile,
    createSGScript,
    isXmlFile,
    util,
} from 'brighterscript';
import { SGChildren, SGComponent } from 'brighterscript/dist/parser/SGTypes';
import { globSync } from 'glob';
import fs from 'fs-extra'
import path from 'path';

export class ComponentIncludesPlugin implements CompilerPlugin {
    public name = 'ComponentIncludesPlugin';

    afterProvideFile(event: AfterProvideFileEvent) {
        if (event.files.length !== 1) {
            return;
        }

        const file = event.files[0];
        if (!isXmlFile(file)) {
            return;
        }
        const program = file.program;

        program.diagnostics.clearByFilter({ file: file, tag: this.name });

        const component = file.parser.ast.componentElement;
        if (!component) {
            return;
        }

        const includes = this.getIncludes(component);
        if (includes.length === 0) {
            return;
        }

        includes.forEach((include) => {
            const rootDir = program.options.rootDir!;

            const includePaths = globSync(`**/${include.name}.part.xml`, { cwd: rootDir });
            if (includePaths.length === 0) {
                program.diagnostics.register({
                    file: file,
                    range: include.range!,
                    message: `Could not find include: ${include.name}`,
                    severity: DiagnosticSeverity.Error,
                    code: 'INCLUDE_NOT_FOUND',
                }, { tags: [this.name] });
                return;
            }

            if (includePaths.length > 1) {
                program.diagnostics.register({
                    file: file,
                    range: include.range!,
                    message: `Found multiple include files for include: ${include.name}`,
                    severity: DiagnosticSeverity.Error,
                    code: 'MULTIPLE_INCLUDES_FOUND',
                }, { tags: [this.name] });
                return;
            }

            const includePath = includePaths[0];
            const srcPath = path.join(rootDir, includePath);

            const xmlFile = new XmlFile({
                srcPath: srcPath,
                program: program,
                destPath: includePath,
            });
            const includeFileContents = fs.readFileSync(srcPath, 'utf8');
            xmlFile.parse(includeFileContents);

            const includeComponent = xmlFile.ast.componentElement;
            if (!includeComponent) {
                return;
            }

            this.addScripts(component, includeComponent, includePath, program);
            this.addFields(component, includeComponent);
            this.addFunctions(component, includeComponent);
            this.addChildren(component, includeComponent);
        });

        component.removeAttribute('includes');
        file.parser.invalidateReferences();
    }

    addScripts(component: SGComponent, includeComponent: SGComponent, includePath: string, program: Program) {
        const includeScripts = includeComponent.scriptElements;
        for (let i = 0; i < includeScripts.length; i++) {
            const script = includeScripts[i];
            component.addChild(script);
        }

        if (program.options.autoImportComponentScript) {
            const possibleCodeBehindPkgPaths = [
                includePath.replace('.xml', '.bs'),
                includePath.replace('.xml', '.brs')
            ];
            possibleCodeBehindPkgPaths.forEach((scriptPkgPath) => {
                const scriptFilePath = path.join(program.options.rootDir!, scriptPkgPath);
                if (fs.existsSync(scriptFilePath)) {
                    const scriptTag = createSGScript({
                        type: "text/brightscript",
                        uri: util.sanitizePkgPath(scriptPkgPath),
                    })
                    component.addChild(scriptTag);
                }
            });
        }
    }

    addFields(component: SGComponent, includeComponent: SGComponent) {
        const interfaceElement = includeComponent.interfaceElement;
        if (!interfaceElement) {
            return;
        }

        const fields = interfaceElement.fields;
        if (!fields || fields.length === 0) {
            return;
        }
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            let alwaysNotify: boolean | undefined = undefined;
            if (field.alwaysNotify) {
                alwaysNotify = field.alwaysNotify === 'true';
            }
            component.setInterfaceField(field.id, field.type, field.onChange, alwaysNotify, field.alias);
        }
    }

    addFunctions(component: SGComponent, includeComponent: SGComponent) {
        const interfaceElement = includeComponent.interfaceElement;
        if (!interfaceElement) {
            return;
        }

        const functions = interfaceElement.functions;
        if (!functions || functions.length === 0) {
            return;
        }

        for (let i = 0; i < functions.length; i++) {
            const func = functions[i];
            component.setInterfaceFunction(func.name);
        }
    }

    addChildren(component: SGComponent, includeComponent: SGComponent) {
        const includeChildren = includeComponent.childrenElement;
        if (!includeChildren) {
            return;
        }

        if (includeChildren.elements.length === 0) {
            return;
        }

        let componentChildren = component.childrenElement;
        if (!componentChildren) {
            componentChildren = new SGChildren({
                startTagOpen: { text: '<' },
                startTagName: { text: 'children' },
                startTagClose: { text: '>' },
                elements: [],
                endTagOpen: { text: '</' },
                endTagName: { text: 'children' },
                endTagClose: { text: '>' }
            });
            component.addChild(componentChildren);
        }
        for (let i = 0; i < includeChildren.elements.length; i++) {
            const child = includeChildren.elements[i];
            componentChildren.elements.push(child);
        }
    }

    getIncludes(component?: SGComponent) {
        if (!component || !component.attributes) {
            return [];
        }

        return component.attributes.filter((attr) => {
            return attr.key === 'includes';
        }).map((attr) => {
            if (!attr.value) {
                return [];
            }
            return attr.value.split(',').map((item) => {
                return {
                    name: item.trim(),
                    range: attr.tokens.value?.location?.range,
                }
            });
        }).flat();
    }
}

export default () => {
    return new ComponentIncludesPlugin();
};
