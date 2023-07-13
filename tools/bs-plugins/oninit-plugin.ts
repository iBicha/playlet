// This plugin takes functions annotated with @oninit and adds them to the component's Init function

import {
    BeforeFileTranspileEvent,
    CompilerPlugin,
    FunctionStatement,
    WalkMode,
    XmlScope,
    createVisitor,
    isBrsFile,
    isXmlScope,
} from 'brighterscript';

import { RawCodeStatement } from './RawCodeStatement';

export class OnInitPlugin implements CompilerPlugin {
    public name = 'OnInitPlugin';

    beforeFileTranspile(event: BeforeFileTranspileEvent) {
        if (!isBrsFile(event.file)) {
            return
        }

        event.file.ast.walk(createVisitor({
            FunctionExpression: (func) => {
                if (!this.hasOnInitAnnotation(func.functionStatement)) {
                    return
                }

                if (!func.functionStatement) {
                    event.program.logger.warn(this.name, `Function had an @oninit annotation, but function statement is not found.`)
                    return
                }

                event.program.logger.info(this.name, `Found @oninit function ${func.functionStatement!.name.text} in file ${event.file.pkgPath}`)

                const scopes = event.program.getScopesForFile(event.file);
                for (let i = 0; i < scopes.length; i++) {
                    const scope = scopes[i];
                    event.program.logger.info(this.name, `  Found scope ${scope.name}`)
                }

                for (let i = 0; i < scopes.length; i++) {
                    const scope = scopes[i];

                    if (!isXmlScope(scope)) {
                        continue;
                    }

                    const initFunction = scope.getCallableByName("Init");

                    if (!initFunction) {
                        // TODO: force create an Init function in a new file (scope.xmlFile.componentName.text + "_initializer.brs")
                        event.program.logger.warn(this.name, `No Init function found in scope ${scope.name}. Function ${func.functionStatement.name.text} will not be added to the component's Init function`)
                        continue;
                    }

                    const callStatement = new RawCodeStatement(`${func.functionStatement.name.text}()`, initFunction.file);
                    event.editor.arrayPush(initFunction.functionStatement.func.body.statements, callStatement);

                    event.program.logger.info(this.name, `Added call to ${func.functionStatement.name.text} in Init function`)

                }
            },
        }), {
            walkMode: WalkMode.visitExpressionsRecursive
        });
    }

    hasOnInitAnnotation(functionStatement: FunctionStatement | undefined) {
        const annotations = functionStatement?.annotations
        if (!annotations || annotations.length === 0) {
            return false
        }
        for (let index = 0; index < annotations.length; index++) {
            const annotation = annotations[index];
            if (annotation.name === "oninit") {
                return true
            }
        }
        return false
    }
}

export default () => {
    return new OnInitPlugin();
};
