import { CompilerPlugin, BeforeFileTranspileEvent, isBrsFile, WalkMode, createVisitor, TokenKind, VariableExpression, Identifier } from 'brighterscript';

export class AsyncTaskPlugin implements CompilerPlugin
{
    public name = 'asyncTaskPlugin';

    beforeFileTranspile(event: BeforeFileTranspileEvent) {
        if (!isBrsFile(event.file)) {
            return
        }
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
                    console.log(funcName)
                }
            },
        }), {
            walkMode: WalkMode.visitExpressionsRecursive
        });
    }
}

export default () => {
    return new AsyncTaskPlugin();
};
