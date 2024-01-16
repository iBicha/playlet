// This plugin handles router annotations (@get, @post, etc) and register
// associated functions with the router.

import {
    BeforeFileTranspileEvent,
    BscFile,
    ClassStatement,
    CompilerPlugin,
    FunctionExpression,
    FunctionStatement,
    MethodStatement,
    OnFileValidateEvent,
    TokenKind,
    WalkMode,
    createVisitor,
    isBrsFile
} from "brighterscript";
import { RawCodeStatement } from "./Classes/RawCodeStatement";

const annotationNames = ['all', 'get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
const httpRouterBaseClass = 'HttpRouter';

export class WebServerPlugin implements CompilerPlugin {
    public name = 'WebServerPlugin';

    onFileValidate(event: OnFileValidateEvent<BscFile>) {
        if (!isBrsFile(event.file)) {
            return;
        }

        // Make sure each class that inherits from HttpRouter has a constructor
        event.file.ast.walk(createVisitor({
            ClassStatement: (classStmt) => {
                if (!classStmt.parentClassName) {
                    return;
                }

                const parentClass = classStmt.parentClassName.expression.name.text;
                if (parentClass !== httpRouterBaseClass) {
                    return;
                }

                const classConstructor = this.getClassConstructor(classStmt);
                if (!classConstructor) {
                    event.file.addDiagnostics([{
                        file: event.file,
                        range: classStmt.name.range,
                        message: `Class ${classStmt.name.text} extends ${httpRouterBaseClass} and must have a constructor`,
                        severity: 1,
                        code: 'HTTP_ROUTER_NO_CONSTRUCTOR',
                    }]);
                }
            },
        }), {
            walkMode: WalkMode.visitStatementsRecursive
        });
    }

    beforeFileTranspile(event: BeforeFileTranspileEvent<BscFile>) {
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
                const stmt = new RawCodeStatement(`m.routes.push({ method: "${method}", path: "${routeInfo.route}", router: m, func: "${func.functionStatement?.name.text}" })`)
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

        const parentClass = classStmt.parentClassName.expression.name.text;
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
            // @ts-ignore
            if (methodStmt.name?.kind === TokenKind.New) {
                return stmt;
            }
        });
    }
}

export default () => {
    return new WebServerPlugin();
};
