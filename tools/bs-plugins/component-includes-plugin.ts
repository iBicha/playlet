// Plugin to allow including other components in a component

import {
    BscFile,
    CompilerPlugin,
    DiagnosticSeverity,
    Program,
    XmlFile,
    isXmlFile,
    util,
} from 'brighterscript';
import { SGChildren, SGComponent, SGInterface, SGScript } from 'brighterscript/dist/parser/SGTypes';
import { globSync } from 'glob';
import fs from 'fs-extra'
import path from 'path';

export class ComponentIncludesPlugin implements CompilerPlugin {
    public name = 'ComponentIncludesPlugin';

    afterFileParse(file: BscFile) {
        if (!isXmlFile(file)) {
            return;
        }
        const program = file.program;

        const component = file.parser.ast.component;
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
                file.addDiagnostics([{
                    file: file,
                    range: include.range!,
                    message: `Could not find include: ${include.name}`,
                    severity: DiagnosticSeverity.Error,
                    code: 'INCLUDE_NOT_FOUND',
                }]);
                return;
            }
            if (includePaths.length > 1) {
                file.addDiagnostics([{
                    file: file,
                    range: include.range!,
                    message: `Found multiple include files for include: ${include}`,
                    severity: DiagnosticSeverity.Error,
                    code: 'MULTIPLE_INCLUDES_FOUND',
                }]);
                return;
            }

            const includePath = includePaths[0];
            const srcPath = path.join(rootDir, includePath);
            const xmlFile = new XmlFile(srcPath, includePath, program);
            const includeFileContents = fs.readFileSync(srcPath, 'utf8');
            xmlFile.parse(includeFileContents);

            const includeComponent = xmlFile.ast.component;
            if (!includeComponent) {
                return;
            }

            this.addScripts(component, includeComponent, includePath, program);
            this.addFields(component, includeComponent);
            this.addFunctions(component, includeComponent);
            this.addChildren(component, includeComponent);
        });

        component.attributes = component.attributes.filter((attr) => {
            return attr.key.text !== 'includes';
        });

        file.parser.invalidateReferences();
    }

    addScripts(component: SGComponent, includeComponent: SGComponent, includePath: string, program: Program) {
        component.scripts.push(...includeComponent.scripts);
        if (program.options.autoImportComponentScript) {
            const possibleCodeBehindPkgPaths = [
                includePath.replace('.xml', '.bs'),
                includePath.replace('.xml', '.brs')
            ];
            possibleCodeBehindPkgPaths.forEach((scriptPkgPath) => {
                const scriptFilePath = path.join(program.options.rootDir!, scriptPkgPath);
                if (fs.existsSync(scriptFilePath)) {
                    const scriptTag = new SGScript();
                    scriptTag.type = "text/brightscript"
                    scriptTag.uri = util.getRokuPkgPath(scriptPkgPath);

                    component.scripts.push(scriptTag);
                }
            });
        }
    }

    addFields(component: SGComponent, includeComponent: SGComponent) {
        if (!includeComponent.api) {
            return;
        }
        if (!includeComponent.api.fields || includeComponent.api.fields.length === 0) {
            return;
        }
        if (!component.api) {
            component.api = new SGInterface({ text: 'interface' }, [])
        }
        component.api.fields.push(...includeComponent.api.fields);
    }

    addFunctions(component: SGComponent, includeComponent: SGComponent) {
        if (!includeComponent.api) {
            return;
        }
        if (!includeComponent.api.functions || includeComponent.api.functions.length === 0) {
            return;
        }
        if (!component.api) {
            component.api = new SGInterface({ text: 'interface' }, [])
        }
        component.api.functions.push(...includeComponent.api.functions);
    }

    addChildren(component: SGComponent, includeComponent: SGComponent) {
        if (!includeComponent.children) {
            return;
        }
        if (!includeComponent.children.children || includeComponent.children.children.length === 0) {
            return;
        }
        if (!component.children) {
            component.children = new SGChildren({ text: 'children' }, [])
        }
        component.children.children.push(...includeComponent.children.children);
    }


    getIncludes(component?: SGComponent) {
        if (!component || !component.attributes) {
            return [];
        }

        return component.attributes.filter((attr) => {
            return attr.key.text === 'includes';
        }).map((attr) => {
            return attr.value.text.split(',').map((item) => {
                return {
                    name: item.trim(),
                    range: attr.value.range,
                }
            });
        }).flat();
    }
}

export default () => {
    return new ComponentIncludesPlugin();
};
