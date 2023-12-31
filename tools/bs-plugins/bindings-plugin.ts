// Plugin to generate node bindings for AutoBind components

import {
    BeforeFileTranspileEvent,
    BscFile,
    CompilerPlugin,
    XmlFile,
    isBrsFile,
    isXmlFile,
    isXmlScope,
    util
} from "brighterscript";
import path from "path";
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
    isAutoBindComponent: boolean,
    fields: { [key: string]: string },
    childProps: ChildProps
}

export class BindingsPlugin implements CompilerPlugin {
    public name = 'BindingsPlugin';

    private bindingsForFile: { [key: string]: Bindings } = {};

    afterFileParse(file: BscFile) {
        if (!isXmlFile(file)) {
            return;
        }

        const program = file.program;
        const bindings = this.getBindingsForXmlFile(file)
        if (!bindings.isAutoBindComponent) {
            return;
        }

        this.bindingsForFile[file.pkgPath] = bindings;

        const bindingsFilePath = this.getBindingScriptPathForXmlFile(file.pkgPath);
        if (!program.hasFile(bindingsFilePath)) {
            program.setFile(bindingsFilePath, bindings_script_template);
        }

        const scriptTag = new SGScript();
        scriptTag.type = "text/brightscript"
        scriptTag.uri = util.getRokuPkgPath(bindingsFilePath);
        if (!file.ast.component!.scripts) {
            file.ast.component!.scripts = [];
        }
        file.ast.component!.scripts.push(scriptTag);

        this.deleteBindingsInFields(file);
        this.deleteBindingsInChildPropsNode(file.ast.component!.children);

        file.parser.invalidateReferences();
    }

    beforeFileTranspile(event: BeforeFileTranspileEvent) {
        if (!isBrsFile(event.file) || !event.file.pkgPath.endsWith('_bindings.bs')) {
            return
        }

        const program = event.program;
        const scope = program.getFirstScopeForFile(event.file);
        if (!scope || !isXmlScope(scope)) {
            return;
        }

        const bindings = this.bindingsForFile[scope.xmlFile.pkgPath];
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

    getBindingsForXmlFile(xmlFile: XmlFile): Bindings {
        const isAutoBindComponent = !!xmlFile.ast.component?.api?.fields?.find((field) => {
            return field.id === 'binding_done';
        }) && xmlFile.componentName.text !== 'AutoBind';

        if (!isAutoBindComponent) {
            return { isAutoBindComponent, fields: {}, childProps: {} };
        }

        const fields = xmlFile.ast.component?.api?.fields?.filter((field) => {
            return field.attributes.find((attr) => attr.key.text === 'bind');
        });

        const childProps: ChildProps = {};
        this.getChildBindings(childProps, xmlFile.ast.component?.children);

        const bindingFields = fields?.reduce((acc, field) => {
            const bindAttr = field.attributes.find((attr) => attr.key.text === 'bind');
            acc[field.id] = bindAttr!.value.text;
            return acc;
        }, {} as { [key: string]: string }) || {};

        return { isAutoBindComponent, fields: bindingFields, childProps: childProps };
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

    deleteBindingsInFields(xmlFile: XmlFile) {
        xmlFile.ast.component!.api!.fields.forEach((field) => {
            field.attributes = field.attributes.filter((attr) => {
                return attr.key.text !== 'bind';
            });
        });
    }

    deleteBindingsInChildPropsNode(node: SGNode) {
        if (!node) {
            return;
        }
        node.attributes = node.attributes.filter((attr) => {
            return !attr.value.text.startsWith('bind:');
        });
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                this.deleteBindingsInChildPropsNode(child);
            }
        }
    }
}

export default () => {
    return new BindingsPlugin();
};
