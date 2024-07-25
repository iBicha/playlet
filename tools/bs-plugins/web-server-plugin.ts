// This plugin handles router annotations (@get, @post, etc) and register
// associated functions with the router.

import {
    BeforePrepareFileEvent,
    ClassStatement,
    CompilerPlugin,
    DiagnosticSeverity,
    FunctionExpression,
    FunctionStatement,
    MethodStatement,
    OnFileValidateEvent,
    ParseMode,
    WalkMode,
    createVisitor,
    isBrsFile
} from "brighterscript";
import { RawCodeStatement } from "./Classes/RawCodeStatement";

const annotationNames = ['all', 'get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
const httpRouterBaseClass = 'HttpRouter';

export class WebServerPlugin implements CompilerPlugin {
    public name = 'WebServerPlugin';

    onFileValidate(event: OnFileValidateEvent) {
        if (!isBrsFile(event.file)) {
            return;
        }

        const program = event.program;
        program.diagnostics.clearByFilter({ file: event.file, tag: this.name });

        // Make sure each class that inherits from HttpRouter has a constructor
        event.file.ast.walk(createVisitor({
            ClassStatement: (classStmt) => {
                if (!classStmt.parentClassName) {
                    return;
                }

                const parentClass = classStmt.parentClassName.getName();
                if (parentClass !== httpRouterBaseClass) {
                    return;
                }

                const classConstructor = this.getClassConstructor(classStmt);
                if (!classConstructor) {
                    program.diagnostics.register({
                        file: event.file,
                        range: classStmt.tokens.name.location.range,
                        message: `Class ${classStmt.tokens.name.text} extends ${httpRouterBaseClass} and must have a constructor`,
                        severity: DiagnosticSeverity.Error,
                        code: 'HTTP_ROUTER_NO_CONSTRUCTOR',
                    }, { tags: [this.name] });
                }
            },
        }), {
            walkMode: WalkMode.visitStatementsRecursive
        });
    }

    beforePrepareFile(event: BeforePrepareFileEvent) {
        if (!isBrsFile(event.file)) {
            return;
        }

        event.file.ast.walk(createVisitor({
            FunctionExpression: (func) => {
                if (!this.isHttpRouterFunction(func)) {
                    return;
                }

                const functionStatement = func.functionStatement;
                if (!functionStatement) {
                    return;
                }

                const routeInfo = this.getRouteInfo(functionStatement);
                if (!routeInfo) {
                    return;
                }

                const classStmt = this.getClass(func);
                if (!classStmt) {
                    return;
                }
                const classConstructor = this.getClassConstructor(classStmt) as MethodStatement;

                const method = routeInfo.method === 'ALL' ? '*' : routeInfo.method;
                const stmt = new RawCodeStatement(`m.routes.push({ method: "${method}", path: "${routeInfo.route}", router: m, func: "${func.functionStatement!.getName(ParseMode.BrighterScript)}" })`)
                event.editor.arrayPush(classConstructor.func.body.statements, stmt);
            },
        }), {
            walkMode: WalkMode.visitExpressionsRecursive
        });
    }

    isHttpRouterFunction(func: FunctionExpression) {
        const classStmt = this.getClass(func);
        if (!classStmt || !classStmt.parentClassName) {
            return false;
        }

        const parentClass = classStmt.parentClassName.getName();
        return parentClass === httpRouterBaseClass;
    }

    getRouteInfo(functionStatement: FunctionStatement | undefined) {
        const annotations = functionStatement?.annotations
        if (!annotations || annotations.length === 0) {
            return undefined
        }

        for (let index = 0; index < annotations.length; index++) {
            const annotation = annotations[index];
            if (annotationNames.includes(annotation.name)) {
                const args = annotation.getArguments()
                if (args.length !== 1) {
                    throw new Error(`Expected 1 argument for annotation ${annotation.name}`)
                }

                if (typeof args[0] !== 'string') {
                    throw new Error(`Expected string argument for annotation ${annotation.name}`)
                }

                return {
                    method: annotation.name.toUpperCase(),
                    route: args[0]
                }
            }
        }
    }

    getClass(func: FunctionExpression) {
        const functionStatement = func.functionStatement;
        if (!functionStatement) {
            return;
        }

        return functionStatement.parent as ClassStatement;
    }

    getClassConstructor(classStmt: ClassStatement) {
        return classStmt.body.find((stmt) => {
            const methodStmt = stmt as MethodStatement;
            if (methodStmt.tokens.name.text === 'new') {
                return stmt;
            }
        });
    }
}

export default () => {
    return new WebServerPlugin();
};
