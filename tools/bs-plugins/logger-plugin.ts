// This plugin generates logging functions based on the usage of the LogError, LogWarn, LogInfo, and LogDebug functions.

import {
    BeforeBuildProgramEvent,
    BeforePrepareFileEvent,
    BrsFile,
    CallExpression,
    CompilerPlugin,
    DottedGetExpression,
    ParseMode,
    Program,
    SourceLiteralExpression,
    TokenKind,
    WalkMode,
    createIdentifier,
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

    beforeBuildProgram(event: BeforeBuildProgramEvent) {
        this.hasLogger = event.program.hasFile(loggingFilePath);
        if (!this.hasLogger) {
            return;
        }

        const usedLogFunctions = new Map<string, LogFunction>();
        const visitor = createVisitor({
            ExpressionStatement: (statement) => {
                const expression = statement.expression as CallExpression;
                if (!expression) {
                    return;
                }
                const callee = expression.callee as DottedGetExpression;
                if (!callee || !callee.getName) {
                    return;
                }
                const funcName = callee.getName(ParseMode.BrightScript);
                if (funcName && logFunctionKeys.includes(funcName)) {
                    const argCount = expression.args.length + 1; // +1 for the file path
                    const newFuncName = `${funcName}${argCount}`;
                    usedLogFunctions.set(newFuncName, {
                        name: funcName,
                        argCount: argCount,
                    });
                }
            },
        });

        for (const file of event.files) {
            if (!isBrsFile(file)) {
                continue;
            }

            file.ast.walk(visitor, {
                walkMode: WalkMode.visitStatementsRecursive
            });
        }

        this.generateLoggingFile(event.program, usedLogFunctions);
    }

    beforePrepareFile(event: BeforePrepareFileEvent) {
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
                const expression = statement.expression as CallExpression;
                if (!expression) {
                    return;
                }
                const callee = expression.callee as DottedGetExpression;
                if (!callee || !callee.getName) {
                    return;
                }
                const funcName = callee.getName(ParseMode.BrightScript);
                if (funcName && logFunctionKeys.includes(funcName)) {
                    const args = expression.args;
                    if (isDebug) {
                        const t = createToken(TokenKind.SourceLocationLiteral, '', statement.expression.location);
                        const sourceExpression = new SourceLiteralExpression({ value: t });
                        event.editor.addToArray(args, 0, sourceExpression);
                    } else {
                        const fileName = path.basename(event.file.srcPath);
                        const line = statement.location!.range.start.line + 1; // range.start.line is 0-based
                        const t = createToken(TokenKind.StringLiteral, `\"[${fileName}:${line}]\"`, statement.expression.location);
                        const sourceExpression = new SourceLiteralExpression({ value: t });
                        event.editor.addToArray(args, 0, sourceExpression);
                    }

                    const newFuncName = `${funcName}${args.length}`;
                    const newFuncIdentifier = createIdentifier(newFuncName, callee.location);
                    event.program.logger.info(this.name, `Replacing ${funcName} with ${newFuncName}`);
                    event.editor.setProperty(callee.tokens, 'name', newFuncIdentifier);
                }
            },
        });

        event.file.ast.walk(visitor, {
            walkMode: WalkMode.visitStatementsRecursive
        });
    }

    generateLoggingFile(program: Program, usedLogFunctions: Map<string, LogFunction>) {
        // @ts-ignore
        const isDebug = !!program.options.debug;

        const file = program.getFile(loggingFilePath) as BrsFile;
        let content = file.fileContents;

        content += '\n\' Start of auto-generated functions\n'
        usedLogFunctions.forEach((logFunction, newFunctionName) => {
            content += this.generateLoggingFunction(newFunctionName, logFunction.name, logFunction.argCount, isDebug);
        });
        content += '\n\' End of auto-generated functions\n'

        file.parse(content);
    }

    generateLoggingFunction(newFunctionName: string, level: string, argCount: number, isDebug: boolean) {
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

        // https://github.com/microsoft/vscode/issues/571
        const USE_COLOR = false;

        const RED = '[31m';
        const YELLOW = '[33m';
        const GREEN = '[32m';
        const BOLD = '[1m';
        const BOLD_RED = '[1;31m';
        const BOLD_YELLOW = '[1;33m';
        const BOLD_GREEN = '[1;32m';
        const CLEAR = '[0m';

        let logLine = '';

        if (isDebug && USE_COLOR) {
            switch (func.stringLevel) {
                case 'ERROR':
                    logLine = `Chr(27) + "${BOLD_RED}" + "[${func.stringLevel}]" + Chr(27) + "${RED}" + ${msg} + Chr(27) + "${CLEAR}"`;
                    break;
                case 'WARN':
                    logLine = `Chr(27) + "${BOLD_YELLOW}" + "[${func.stringLevel}]" + Chr(27) + "${YELLOW}" + ${msg} + Chr(27) + "${CLEAR}"`;
                    break;
                case 'INFO':
                    logLine = `Chr(27) + "${BOLD}" + "[${func.stringLevel}]" + Chr(27) + "${CLEAR}" + ${msg}`;
                    break;
                case 'DEBUG':
                    logLine = `Chr(27) + "${BOLD_GREEN}" + "[${func.stringLevel}]" + Chr(27) + "${GREEN}" + ${msg} + Chr(27) + "${CLEAR}"`;
                    break;
                default:
                    throw new Error(`Unknown log level: ${func.stringLevel}`);
            }
        }
        else {
            logLine = `"[${func.stringLevel}]" + ${msg}`
        }

        return `
function ${newFunctionName}(${args.join(', ')}) as void
    logger = m.global.logger
    if logger.logLevel < ${func.level}
        return
    end if
    logger.logLine = ${logLine}
end function
`;
    }
}

export default () => {
    return new LoggerPlugin();
};
