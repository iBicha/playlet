// This plugin generates a task component for each function annotated with @asynctask

import {
    AfterFileAddEvent,
    BeforeProgramValidateEvent,
    BrsFile,
    BscFile,
    CompilerPlugin,
    createVisitor,
    DiagnosticSeverity,
    FunctionStatement,
    isBrsFile,
    ParseMode,
    Program,
    WalkMode,
    XmlFile,
} from 'brighterscript';

export class AsyncTaskPlugin implements CompilerPlugin {
    public name = 'AsyncTaskPlugin';

    afterFileAdd(event: AfterFileAddEvent) {
        if (!isBrsFile(event.file)) {
            return;
        }

        const program = event.program;

        event.file.ast.walk(createVisitor({
            FunctionStatement: (funcStmt) => {
                if (!this.isAsyncTask(funcStmt)) {
                    return;
                }

                const functionName = funcStmt.getName(ParseMode.BrightScript);
                const hasParams = funcStmt.func.parameters.length > 0;
                const taskName = `${functionName}_AsyncTask`;

                const bs = this.generateBsTask(functionName, hasParams, event.file);
                const bsFile = `components/AsyncTask/generated/${taskName}.bs`;

                const xml = this.generateXmlTask(taskName, bsFile);
                const xmlFile = `components/AsyncTask/generated/${taskName}.xml`;

                // clear existing diagnostics
                program.diagnostics.clearByFilter({ file: event.file, tag: this.name });

                if (program.hasFile(xmlFile)) {
                    const currentContent = (program.getFile(xmlFile) as XmlFile).fileContents;
                    if (currentContent !== xml) {
                        program.diagnostics.register({
                            file: event.file,
                            range: funcStmt.tokens.name.location.range,
                            message: `AsyncTaskPlugin: file ${xmlFile} already exists`,
                            severity: DiagnosticSeverity.Error,
                            code: 'ASYNC_TASK_FILE_EXISTS',
                        }, { tags: [this.name] });
                    }
                }
                program.setFile(xmlFile, xml);

                if (program.hasFile(bsFile)) {
                    const currentContent = (program.getFile(bsFile) as BrsFile).fileContents;
                    if (currentContent !== bs) {
                        program.diagnostics.register({
                            file: event.file,
                            range: funcStmt.tokens.name.location.range,
                            message: `AsyncTaskPlugin: file ${bsFile} already exists`,
                            severity: DiagnosticSeverity.Error,
                            code: 'ASYNC_TASK_FILE_EXISTS',
                        }, { tags: [this.name] });
                    }
                }
                program.setFile(bsFile, bs);
            }
        }), {
            walkMode: WalkMode.visitStatements
        });
    }

    beforeProgramValidate(event: BeforeProgramValidateEvent) {
        this.generateTaskListEnum(event.program);
    }

    isAsyncTask(functionStatement: FunctionStatement | undefined) {
        const annotations = functionStatement?.annotations
        if (!annotations || annotations.length === 0) {
            return false
        }
        for (let index = 0; index < annotations.length; index++) {
            const annotation = annotations[index];
            if (annotation.name === "asynctask") {
                return true
            }
        }
        return false
    }

    generateBsTask(functionName: string, hasInput: boolean, file: BscFile): string {
        return `
import "pkg:/${file.pkgPath}"
import "pkg:/source/utils/ErrorUtils.bs"

function Init()
    m.top.functionName = "TaskMain"
    m.top.cancellation = {
        node: m.top
        field: "cancel"
        value: true
    }
end function

function TaskMain()
    try
        result = ${functionName}(${(hasInput ? "m.top.input" : "")})
        m.top.setField("output", {
            success: true
            task: m.top
            cancelled: m.top.cancel
            result: result
        })
    catch e
        #if DEBUG
            print "ERROR in ${functionName}: "
            print ErrorUtils.Format(e)
        #end if
        m.top.setField("output", {
            success: false
            task: m.top
            cancelled: m.top.cancel
            error: e
        })
    end try
end function
`
    }

    generateXmlTask(taskName: string, bsFile: string): string {

        return `<?xml version="1.0" encoding="UTF-8" ?>

<component name="${taskName}" extends="Task">
  <interface>
    <field id="input" type="assocarray" />
    <field id="output" type="assocarray" />
    <field id="cancel" type="boolean" alwaysNotify="true" />
    <field id="cancellation" type="assocarray" />
  </interface>
</component>`
    }

    generateTaskListEnum(program: Program) {
        const asyncTasks = Object.values(program.files).reduce((acc, file) => {
            if (!isBrsFile(file)) {
                return acc
            }

            file.ast.walk(createVisitor({
                FunctionExpression: (func) => {
                    if (!this.isAsyncTask(func.functionStatement)) {
                        return
                    }

                    acc.add(func.functionStatement!.getName(ParseMode.BrightScript))
                },
            }), {
                walkMode: WalkMode.visitExpressionsRecursive
            });

            return acc
        }, new Set<string>());

        const enumItems = Array.from(asyncTasks).map((task) => {
            return `${task} = "${task}_AsyncTask"`
        })

        const content = 'enum Tasks\n    ' + enumItems.join('\n    ') + '\nend enum\n';

        program.setFile('source/AsyncTask/Tasks.bs', content);
    }
}

export default () => {
    return new AsyncTaskPlugin();
};
