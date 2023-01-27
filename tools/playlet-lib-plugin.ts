import {
    CompilerPlugin,
    BeforeFileTranspileEvent,
    isBrsFile,
    WalkMode,
    createVisitor,
    TokenKind
} from 'brighterscript';
const ip = require('ip');

export class PlayletLibPlugin implements CompilerPlugin {
    public name = 'playletLibPlugin';

    beforeFileTranspile(event: BeforeFileTranspileEvent) {
        if (!isBrsFile(event.file)) {
            return
        }

        event.file.ast.walk(createVisitor({
            LiteralExpression: (literal) => {
                if (literal.token.kind === TokenKind.StringLiteral && literal.token.text.includes('<DEBUG_HOST_IP_ADDRESS>')) {
                    event.editor.setProperty(literal.token, 'text', literal.token.text.replace('<DEBUG_HOST_IP_ADDRESS>', ip.address()));
                }
            }
        }), {
            walkMode: WalkMode.visitExpressionsRecursive
        });
    }
}

export default () => {
    return new PlayletLibPlugin();
};
