// This plugin takes functions annotated with @oninit and adds them to the component's Init function

import {
    AfterFileValidateEvent,
    AnnotationExpression,
    BeforePrepareFileEvent,
    BeforeScopeValidateEvent,
    BrsFile,
    Callable,
    CompilerPlugin,
    DiagnosticSeverity,
    FunctionStatement,
    ParseMode,
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

    afterScopeValidate(event: BeforeScopeValidateEvent) {
        const scope = event.scope;
        if (!isXmlScope(scope)) {
            return;
        }

        const onInitCallables = this.getOnInitCallables(scope);
        if (onInitCallables.length === 0) {
            return;
        }

        const program = event.program;
        program.diagnostics.clearByFilter({ file: scope.xmlFile, tag: this.name });

        const initFunction = this.getInitCallableInScope(scope);
        if (!initFunction) {
            onInitCallables.forEach((onInitCallable) => {
                program.diagnostics.register({
                    file: scope.xmlFile,
                    range: onInitCallable.annotation!.location!.range,
                    message: `function ${onInitCallable.callable.functionStatement.getName(ParseMode.BrightScript)} with @oninit annotation is included in ${scope.name}, but no Init function was found in the component.`,
                    severity: DiagnosticSeverity.Error,
                    code: "ONINIT_NO_INIT_FUNCTION"
                });
            });
        }
    }

    afterFileValidate(event: AfterFileValidateEvent) {
        const file = event.file;
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

        program.diagnostics.clearByFilter({ file: file, tag: this.name });

        const initFunction = this.getInitCallableInFile(file);
        if (initFunction && scopes.length > 1 && onInitCallables.length > 0) {
            program.diagnostics.register({
                file,
                range: initFunction.functionStatement.location!.range,
                message: `Init function will call @oninit functions, but is included in multiple scopes.`,
                severity: DiagnosticSeverity.Error,
                code: "ONINIT_INIT_FUNCTION_MULTIPLE_SCOPES"
            });
        }

        for (let i = 0; i < onInitCallables.length; i++) {
            const onInitCallable = onInitCallables[i];

            const functionName = onInitCallable.callable.functionStatement.getName(ParseMode.BrightScript);
            if (!functionName) {
                program.diagnostics.register({
                    file: onInitCallable.callable.file,
                    range: onInitCallable.annotation!.location!.range,
                    message: `function with @oninit annotation must have a name`,
                    severity: DiagnosticSeverity.Error,
                    code: "ONINIT_FUNCTION_NO_NAME"
                });
            }

            const paramCount = onInitCallable.callable.functionStatement.func.parameters.length;
            if (paramCount > 0) {
                program.diagnostics.register({
                    file: onInitCallable.callable.file,
                    range: onInitCallable.annotation!.location!.range,
                    message: `function ${functionName} with @oninit annotation must not have parameters`,
                    severity: DiagnosticSeverity.Error,
                    code: "ONINIT_FUNCTION_PARAMETERS"
                });
            }
        }
    }

    beforePrepareFile(event: BeforePrepareFileEvent) {
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

            const functionName = onInitCallable.callable.functionStatement.getName(ParseMode.BrightScript);
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
            return callable.functionStatement.getName(ParseMode.BrightScript) === "Init";
        });
    }

    getInitCallableInScope(scope: XmlScope): Callable | undefined {
        return scope.getOwnCallables().find((callable) => {
            return callable.callable.functionStatement.getName(ParseMode.BrightScript) === "Init";
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

        return args[0]!.valueOf() as number;
    }
}

export default () => {
    return new OnInitPlugin();
};
