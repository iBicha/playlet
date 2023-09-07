// This plugin takes functions annotated with @oninit and adds them to the component's Init function

import {
    AnnotationExpression,
    BeforeFileTranspileEvent,
    BrsFile,
    BscFile,
    Callable,
    CallableContainerMap,
    CompilerPlugin,
    DiagnosticSeverity,
    FunctionStatement,
    Scope,
    XmlScope,
    isBrsFile,
    isXmlScope,
} from 'brighterscript';

import { RawCodeStatement } from './Classes/RawCodeStatement';

// The plugin processes the file that includes the Init function, not the file that includes the @oninit functions
// This is because the modifications will be made to the Init function.
// The rules are:
// 1. If the scope inclues @oninit functions, the scope must include an Init function
// 2. An Init function that will be calling @oninit functions must be included in only one scope
// 3. @oninit functions must have a name

export class OnInitPlugin implements CompilerPlugin {
    public name = 'OnInitPlugin';

    afterScopeValidate(scope: Scope, files: BscFile[], callables: CallableContainerMap) {
        if (!isXmlScope(scope)) {
            return;
        }

        const onInitCallables = this.getOnInitCallables(scope);
        if (onInitCallables.length === 0) {
            return;
        }

        const initFunction = this.getInitCallableInScope(scope);
        if (!initFunction) {
            onInitCallables.forEach((onInitCallable) => {
                // TODO:P2 we currently add diagnostics to the xml file, but we should add them to the brs file
                // The reasons is, when we add to a generated file (like Component_bindings.brs), the errors
                // Are stuck, and won't be fixed until the file is changed, which we can't do since it's not a real file.
                scope.xmlFile.addDiagnostics([{
                    file: scope.xmlFile,
                    range: onInitCallable.annotation!.range,
                    message: `function ${onInitCallable.callable.functionStatement.name.text} with @oninit annotation is included in ${scope.name}, but no Init function was found in the component.`,
                    severity: DiagnosticSeverity.Error,
                    code: 1818
                }]);
            });
        }
    }

    afterFileValidate(file: BscFile) {
        if (!isBrsFile(file)) {
            return
        }

        const program = file.program;

        const scopes = this.getScopes(file);
        if (scopes.length === 0) {
            return;
        }

        const scope = scopes[0];
        const onInitCallables = this.getOnInitCallables(scope);
        if (onInitCallables.length === 0) {
            program.logger.info(this.name, `No Init processing: No @oninit functions found in scope ${scope.name}`)
            return;
        }

        const initFunction = this.getInitCallableInFile(file);
        if (initFunction && scopes.length > 1 && onInitCallables.length > 0) {
            file.addDiagnostics([{
                file,
                range: initFunction.functionStatement!.func.range,
                message: `Init function will call @oninit functions, but is included in multiple scopes.`,
                severity: DiagnosticSeverity.Error,
                code: 1819
            }]);
        }

        for (let i = 0; i < onInitCallables.length; i++) {
            const onInitCallable = onInitCallables[i];

            const functionName = onInitCallable.callable.functionStatement?.name.text;
            if (!functionName) {
                file.addDiagnostics([{
                    file: onInitCallable.callable.file,
                    range: onInitCallable.annotation!.range,
                    message: `function with @oninit annotation must have a name`,
                    severity: DiagnosticSeverity.Error,
                    code: 1820
                }]);
            }
        }
    }

    beforeFileTranspile(event: BeforeFileTranspileEvent) {
        if (!isBrsFile(event.file)) {
            return
        }

        const program = event.program;
        const file = event.file;

        const scopes = this.getScopes(file);
        if (scopes.length === 0) {
            program.logger.info(this.name, `No Init processing: No scopes found in ${file.pkgPath}`)
            return;
        }

        const initFunction = this.getInitCallableInFile(file);
        if (!initFunction) {
            program.logger.info(this.name, `No Init processing: No Init function found in ${file.pkgPath}`)
            return;
        }

        if (scopes.length > 1) {
            program.logger.info(this.name, `No Init processing: Init function included in more than one scope`)
            return;
        }

        const scope = scopes[0];

        const onInitCallables = this.getOnInitCallables(scope);
        if (onInitCallables.length === 0) {
            program.logger.info(this.name, `No Init processing: No @oninit functions found in scope ${scope.name}`)
            return;
        }

        const orderedStatements = initFunction.functionStatement.func.body.statements.map((statement) => {
            return { order: 0, statement: statement }
        });

        for (let i = 0; i < onInitCallables.length; i++) {
            const onInitCallable = onInitCallables[i];

            const functionName = onInitCallable.callable.functionStatement?.name.text;
            if (!functionName) {
                continue;
            }

            const callSource = `${functionName}() ' auto-generated!`

            const callStatement = new RawCodeStatement(callSource, file);

            const order = this.getOnInitOrder(onInitCallable.annotation!);

            orderedStatements.push({ order, statement: callStatement });

            program.logger.info(this.name, `Added call to ${functionName} in Init function of ${scope.name} (${file.pkgPath})`)
        }

        const statements = orderedStatements.sort((a, b) => {
            return a.order - b.order;
        }).map((orderedStatement) => {
            return orderedStatement.statement;
        });

        event.editor.setProperty(initFunction.functionStatement.func.body, 'statements', statements);
    }

    getScopes(file: BrsFile): XmlScope[] {
        return file.program.getScopesForFile(file).filter((scope) => {
            return isXmlScope(scope);
        }) as XmlScope[];
    }

    getInitCallableInFile(file: BrsFile): Callable | undefined {
        return file.callables.find((callable) => {
            return callable.functionStatement?.name.text === "Init";
        });
    }

    getInitCallableInScope(scope: XmlScope): Callable | undefined {
        return scope.getOwnCallables().find((callable) => {
            return callable.callable.functionStatement?.name.text === "Init";
        })?.callable;
    }

    getOnInitCallables(scope: XmlScope) {
        return scope.getOwnCallables().map((callable) => {
            return {
                callable: callable.callable,
                annotation: this.getOnInitAnnotation(callable.callable.functionStatement)
            }
        }).filter((callable) => {
            return callable.annotation;
        });
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
