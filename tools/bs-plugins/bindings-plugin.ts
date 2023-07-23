import {
    BeforeFileTranspileEvent,
    CompilerPlugin,
    Scope,
    XmlFile,
    isBrsFile,
    isXmlScope,
    util
} from "brighterscript";
import path from "path";
import { PluginXmlFile } from "./Classes/PluginXmlFile";
import { SGNode, SGScript } from "brighterscript/dist/parser/SGTypes";
import { RawCodeStatement } from "./Classes/RawCodeStatement";


const bindings_function_name = 'InitializeBindings';
const bindings_script_template = `
' This method is auto-generated!
@oninit(-1)
function ${bindings_function_name}()
    throw "This method was not populated by the BindingsPlugin!"
end function
`;

type ChildProps = {
    [key: string]: { [key: string]: string }
}

type Bindings = {
    fields: { [key: string]: string },
    childProps: ChildProps
}

export class BindingsPlugin implements CompilerPlugin {
    public name = 'BindingsPlugin';

    private bindingsForScope: { [key: string]: Bindings } = {};

    afterScopeCreate(scope: Scope) {
        if (!isXmlScope(scope)) {
            return;
        }

        const program = scope.program;

        const bindings = this.getBindingsForXmlFile(scope.xmlFile)
        if (!bindings) {
            return;
        }

        program.logger.info('BindingsPlugin', `Found bindings in ${scope.xmlFile.pkgPath}`);

        this.bindingsForScope[scope.name] = bindings;

        const xmlFile = new PluginXmlFile(scope.xmlFile);
        xmlFile.parse();

        const bindingsFilePath = this.getBindingScriptPathForXmlFile(scope.xmlFile.pkgPath);
        if (!program.hasFile(bindingsFilePath)) {
            program.setFile(bindingsFilePath, bindings_script_template);
        }

        const scriptTag = new SGScript();
        scriptTag.type = "text/brightscript"
        scriptTag.uri = util.getRokuPkgPath(bindingsFilePath);
        xmlFile.addScripts([scriptTag]);

        this.deleteBindingsInFields(xmlFile);
        this.deleteBindingsInChildProps(xmlFile);

        const newXmlContent = xmlFile.stringify();
        program.setFile(scope.xmlFile.pkgPath, newXmlContent);
    }

    beforeFileTranspile(event: BeforeFileTranspileEvent) {
        if (!isBrsFile(event.file) || !event.file.pkgPath.endsWith('_bindings.bs')) {
            return
        }

        const program = event.program;
        const scope = program.getFirstScopeForFile(event.file);
        if (!isXmlScope(scope)) {
            return;
        }

        const bindings = this.bindingsForScope[scope.name];
        if (!bindings) {
            return;
        }

        if (event.file.callables.length !== 1) {
            throw new Error(`Bindings file ${event.file.pkgPath} should have exactly one callable`);
        }

        const bindingsFunction = event.file.callables[0];
        if (bindingsFunction.functionStatement.name.text !== bindings_function_name) {
            throw new Error(`Bindings file ${event.file.pkgPath} should have exactly one function named ${bindings_function_name}`);
        }

        let bindingFields = "{\n" + Object.keys(bindings.fields || {}).map((fieldId) => {
            return `        "${fieldId}": "${bindings.fields![fieldId]}"`;
        }).join(', \n') + "\n    }";

        let bindingChildProps = "{\n" + Object.keys(bindings.childProps).map((childId) => {
            return `        "${childId}": {\n${Object.keys(bindings.childProps[childId]).map((prop) => {
                return `            "${prop}": "${bindings.childProps[childId][prop]}"`;
            }).join(', \n')}\n        }`;
        }).join(', \n') + "\n    }";

        const statements = [
            new RawCodeStatement(
                `m.top.bindings = {
    fields: ${bindingFields},
    childProps: ${bindingChildProps}
}`)
        ];
        event.editor.setProperty(bindingsFunction.functionStatement.func.body, 'statements', statements);
    }

    getBindingScriptPathForXmlFile(xmlFilePath: string) {
        const xmlFileDir = path.dirname(xmlFilePath);
        const xmlFileName = path.basename(xmlFilePath);
        const bindingScriptName = xmlFileName.replace('.xml', '_bindings.bs');
        const bindingScriptPath = path.join(xmlFileDir, bindingScriptName);
        return bindingScriptPath;
    }

    getBindingsForXmlFile(xmlFile: XmlFile): Bindings | undefined {
        const fields = xmlFile.ast.component?.api?.fields?.filter((field) => {
            return field.attributes.find((attr) => attr.key.text === 'bind');
        });

        const childProps: ChildProps = {};
        this.getChildBindings(childProps, xmlFile.ast.component?.children);

        if (!fields?.length && !Object.keys(childProps).length) {
            return undefined;
        }

        const bindingFields = fields?.reduce((acc, field) => {
            const bindAttr = field.attributes.find((attr) => attr.key.text === 'bind');
            acc[field.id] = bindAttr!.value.text;
            return acc;
        }, {} as { [key: string]: string }) || {};

        return { fields: bindingFields, childProps: childProps };
    }

    getChildBindings(bindings: ChildProps, node: SGNode | undefined) {
        if (!node) {
            return;
        }
        if (node.id) {
            const props = node.attributes.filter((attr) => attr.value.text.startsWith('bind:'));
            if (props.length) {
                if (!bindings[node.id]) {
                    bindings[node.id] = {};
                }
                for (let i = 0; i < props.length; i++) {
                    const prop = props[i];
                    bindings[node.id][prop.key.text] = prop.value.text.replace('bind:', '');
                }
            }
        }
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                this.getChildBindings(bindings, child);
            }
        }
    }

    deleteBindingsInFields(xmlFile: PluginXmlFile) {
        if (!xmlFile.parsed!.component.interface.length || !xmlFile.parsed!.component.interface[0].field) {
            return;
        }

        xmlFile.parsed!.component.interface[0].field =
            (xmlFile.parsed!.component.interface[0].field as any[]).map((field) => {
                delete field.$.bind;
                return field;
            });
    }

    deleteBindingsInChildProps(xmlFile: PluginXmlFile) {
        if (!xmlFile.parsed!.component.children || !xmlFile.parsed!.component.children.length) {
            return;
        }

        this.deleteBindingsInChildPropsNode(xmlFile.parsed!.component.children);
    }

    deleteBindingsInChildPropsNode(node: any) {
        node.forEach((child: any) => {
            Object.keys(child).forEach((key) => {
                if (key === '$') {
                    Object.keys(child.$).forEach((key) => {
                        if (child.$[key].startsWith('bind:')) {
                            delete child.$[key];
                        }
                    });
                } else {
                    this.deleteBindingsInChildPropsNode(child[key]);
                }
            });
        });
    }
}


export default () => {
    return new BindingsPlugin();
};
