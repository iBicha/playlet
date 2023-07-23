// This plugin takes functions annotated with @oninit and adds them to the component's Init function

import {
    AnnotationExpression,
    BeforeFileTranspileEvent,
    CompilerPlugin,
    FunctionStatement,
    isBrsFile,
    isXmlScope,
} from 'brighterscript';

import { RawCodeStatement } from './Classes/RawCodeStatement';

export class OnInitPlugin implements CompilerPlugin {
    public name = 'OnInitPlugin';

    beforeFileTranspile(event: BeforeFileTranspileEvent) {
        if (!isBrsFile(event.file)) {
            return
        }

        const program = event.program;

        const initFunction = event.file.callables.find((callable) => {
            return callable.functionStatement?.name.text === "Init";
        });

        if (!initFunction) {
            program.logger.info(this.name, `No Init found in ${event.file.pkgPath}`)
            return;
        }

        const scopes = program.getScopesForFile(event.file).filter((scope) => {
            return isXmlScope(scope);
        });

        if (scopes.length !== 1) {
            program.logger.info(this.name, `No Init processing: Number of scopes ${scopes.length} != 1 for ${event.file.pkgPath}`)
            return;
        }

        const scope = scopes[0];
        const onInitCallables = scope.getOwnCallables().map((callable) => {
            return {
                callable: callable,
                annotation: this.getOnInitAnnotation(callable.callable.functionStatement)
            }
        }).filter((callable) => {
            return callable.annotation;
        });

        if (onInitCallables.length === 0) {
            program.logger.info(this.name, `No Init processing: No @oninit functions found in ${scope.name}`)
            return;
        }


        const orderedStatements = initFunction.functionStatement.func.body.statements.map((statement) => {
            return { order: 0, statement: statement }
        });

        for (let i = 0; i < onInitCallables.length; i++) {
            const onInitCallable = onInitCallables[i];
            const functionName = onInitCallable.callable.callable.functionStatement?.name.text;
            if (!functionName) {
                program.logger.info(this.name, `No Init processing: No function name found for @oninit function in ${scope.name}`)
                continue;
            }

            const callSource = `${functionName}() ' auto-generated!`

            const callStatement = new RawCodeStatement(callSource, initFunction.file);

            const order = this.getOnInitOrder(onInitCallable.annotation!);

            orderedStatements.push({ order, statement: callStatement });

            program.logger.info(this.name, `Added call to ${functionName} in Init function of ${scope.name} (${initFunction.file.pkgPath})`)
        }

        const statements = orderedStatements.sort((a, b) => {
            return a.order - b.order;
        }).map((orderedStatement) => {
            return orderedStatement.statement;
        });

        event.editor.setProperty(initFunction.functionStatement.func.body, 'statements', statements);
    }

    getOnInitAnnotation(functionStatement: FunctionStatement | undefined) {
        return functionStatement?.annotations?.find((annotation) => {
            return annotation.name === "oninit";
        });
    }

    getOnInitOrder(annotation: AnnotationExpression): number {
        const args = annotation.getArguments();
        if (!args || args.length === 0) {
            return 0;
        }

        return args[0].valueOf() as number;
    }
}

export default () => {
    return new OnInitPlugin();
};
