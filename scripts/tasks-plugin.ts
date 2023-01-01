import { CompilerPlugin, BeforeFileTranspileEvent, isBrsFile, WalkMode, createVisitor, TokenKind, VariableExpression, Identifier } from 'brighterscript';

// plugin factory
export default function () {
    return {
        name: 'replacePlaceholders',
        // transform AST before transpilation
        beforeFileTranspile: (event: BeforeFileTranspileEvent) => {
            if (isBrsFile(event.file)) {
                event.file.ast.walk(createVisitor({
                    LiteralExpression: (literal) => {
                        //replace every occurance of <FIRST_NAME> in strings with "world"
                        if (literal.token.kind === TokenKind.StringLiteral && literal.token.text.includes('<FIRST_NAME>')) {
                            event.editor.setProperty(literal.token, 'text', literal.token.text.replace('<FIRST_NAME>', 'world'));
                        }
                    },
                    CallExpression: (call) => {
                        /* @ts-ignore */
                        const funcName = call.callee.name?.text
                        if (funcName === "StartTask") {
                            /* @ts-ignore */
                            let identifier: Identifier = {
                                kind: TokenKind.Identifier,
                                text: "Hi",
                            }
                            /* @ts-ignore */
                            event.editor.arrayPush(call.args, [new VariableExpression(identifier)])
                            console.log(call)
                        }
                    },
                }), {
                    walkMode: WalkMode.visitExpressionsRecursive
                });
            }
        }
    } as CompilerPlugin;
};
