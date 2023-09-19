// This plugin generates logging functions based on the usage of the LogError, LogWarn, LogInfo, and LogDebug functions.

import {
    AstEditor,
    BeforeFileTranspileEvent,
    BscFile,
    CompilerPlugin,
    Program,
    SourceLiteralExpression,
    TokenKind,
    TranspileObj,
    WalkMode,
    createToken,
    createVisitor,
    isBrsFile,
} from 'brighterscript';
import path from 'path';

const loggingFilePath = 'source/utils/Logging.bs';
const logFunctions = {
    LogError: {
        stringLevel: 'ERROR',
        level: 0,
    },
    LogWarn: {
        stringLevel: 'WARN',
        level: 1,
    },
    LogInfo: {
        stringLevel: 'INFO',
        level: 2,
    },
    LogDebug: {
        stringLevel: 'DEBUG',
        level: 3,
    }
}

const logFunctionKeys = Object.keys(logFunctions);

type LogFunction = {
    name: string;
    argCount: number;
}

export class LoggerPlugin implements CompilerPlugin {
    public name = 'LoggerPlugin';

    private hasLogger = false;

    beforeProgramTranspile(program: Program, entries: TranspileObj[], editor: AstEditor) {
        this.hasLogger = program.hasFile(loggingFilePath);
        if (!this.hasLogger) {
            return;
        }

        const usedLogFunctions = new Map<string, LogFunction>();

        for (const entry of entries) {
            if (!isBrsFile(entry.file)) {
                continue;
            }

            const visitor = createVisitor({
                ExpressionStatement: (statement) => {
                    // @ts-ignore
                    const funcName = statement.expression.callee?.name?.text;
                    if (funcName && logFunctionKeys.includes(funcName)) {
                        // @ts-ignore
                        const argCount = statement.expression.args.length + 1; // +1 for the file path
                        const newFuncName = `${funcName}${argCount}`;
                        usedLogFunctions.set(newFuncName, {
                            name: funcName,
                            argCount: argCount,
                        });
                    }
                },
            });

            for (const func of entry.file.parser.references.functionExpressions) {
                func.body.walk(visitor, {
                    walkMode: WalkMode.visitStatements
                });
            }
        }

        this.generateLoggingFile(program, usedLogFunctions);
    }

    beforeFileTranspile(event: BeforeFileTranspileEvent<BscFile>) {
        if (!this.hasLogger) {
            return;
        }

        if (!isBrsFile(event.file)) {
            return;
        }

        // @ts-ignore
        const isDebug = !!event.program.options.debug;

        const visitor = createVisitor({
            ExpressionStatement: (statement) => {
                // @ts-ignore
                const funcName = statement.expression.callee?.name?.text;
                if (funcName && logFunctionKeys.includes(funcName)) {
                    // @ts-ignore
                    const args = statement.expression.args;
                    if (isDebug) {
                        const t = createToken(TokenKind.SourceLocationLiteral, '', statement.expression.range);
                        let sourceExpression = new SourceLiteralExpression(t);
                        event.editor.addToArray(args, 0, sourceExpression);
                    } else {
                        const fileName = path.basename(event.file.pkgPath);
                        const line = statement.range.start.line;
                        const t = createToken(TokenKind.StringLiteral, `\"[${fileName}:${line}]\"`, statement.expression.range);
                        let sourceExpression = new SourceLiteralExpression(t);
                        event.editor.addToArray(args, 0, sourceExpression);
                    }

                    const newFuncName = `${funcName}${args.length}`;
                    event.program.logger.info(this.name, `Replacing ${funcName} with ${newFuncName}`);
                    // @ts-ignore
                    event.editor.setProperty(statement.expression.callee?.name, 'text', `${newFuncName}`)
                }
            },
        });

        for (const func of event.file.parser.references.functionExpressions) {
            func.body.walk(visitor, {
                walkMode: WalkMode.visitStatements
            });
        }
    }

    generateLoggingFile(program: Program, usedLogFunctions: Map<string, LogFunction>) {
        const file = program.getFile(loggingFilePath);
        let content = file.fileContents;

        content += '\n\' Start of auto-generated functions\n'
        usedLogFunctions.forEach((logFunction, newFunctionName) => {
            content += this.generateLoggingFunction(newFunctionName, logFunction.name, logFunction.argCount);
        });
        content += '\n\' End of auto-generated functions\n'

        program.setFile(loggingFilePath, content)
    }

    generateLoggingFunction(newFunctionName: string, level: string, argCount: number) {
        const args: string[] = [];
        const argsParams: string[] = [];
        for (let i = 0; i < argCount; i++) {
            args.push(`arg${i}`);
            argsParams.push(`arg${i} as object`);
        }

        const msg = args.map((arg) => {
            return `ToString(${arg})`;
        }).join(` + " " + `);

        const func = logFunctions[level as 'LogError' | 'LogWarn' | 'LogInfo' | 'LogDebug'];

        return `
function ${newFunctionName}(${args.join(', ')}) as void
    logger = m.global.logger
    if logger.logLevel < ${func.level}
        return
    end if
    m.global.logger.logLine = "[${func.stringLevel}]" + ${msg}
end function
`;
    }
}

export default () => {
    return new LoggerPlugin();
};
