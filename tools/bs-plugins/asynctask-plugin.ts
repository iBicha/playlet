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

                const functionName = this.getFunctionName(funcStmt);
                const hasParams = funcStmt.func.parameters.length > 0;
                const taskName = this.getTaskName(funcStmt);

                const bsFileContent = this.generateBsTask(functionName, hasParams, event.file);
                const bsFilePath = `components/AsyncTask/generated/${taskName}.bs`;

                const xmlFileContent = this.generateXmlTask(taskName);
                const xmlFilePath = `components/AsyncTask/generated/${taskName}.xml`;

                program.diagnostics.clearByFilter({ file: event.file, tag: this.name });

                if (program.hasFile(xmlFilePath)) {
                    const currentContent = (program.getFile(xmlFilePath) as XmlFile).fileContents;
                    if (currentContent !== xmlFileContent) {
                        program.diagnostics.register({
                            file: event.file,
                            range: funcStmt.tokens.name.location.range,
                            message: `AsyncTaskPlugin: file ${xmlFilePath} already exists`,
                            severity: DiagnosticSeverity.Error,
                            code: 'ASYNC_TASK_FILE_EXISTS',
                        }, { tags: [this.name] });
                    }
                }

                if (program.hasFile(bsFilePath)) {
                    const currentContent = (program.getFile(bsFilePath) as BrsFile).fileContents;
                    if (currentContent !== bsFileContent) {
                        program.diagnostics.register({
                            file: event.file,
                            range: funcStmt.tokens.name.location.range,
                            message: `AsyncTaskPlugin: file ${bsFilePath} already exists`,
                            severity: DiagnosticSeverity.Error,
                            code: 'ASYNC_TASK_FILE_EXISTS',
                        }, { tags: [this.name] });
                    }
                }

                event.program.setFile(xmlFilePath, xmlFileContent);
                event.program.setFile(bsFilePath, bsFileContent);
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

    getFunctionName(funcStmt: FunctionStatement) {
        return funcStmt.getName(ParseMode.BrightScript);
    }

    getTaskName(funcStmt: FunctionStatement) {
        return this.getFunctionName(funcStmt) + '_AsyncTask';
    }

    generateBsTask(functionName: string, hasInput: boolean, file: BscFile): string {
        return `
import "pkg:/${file.destPath}"
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

    generateXmlTask(taskName: string): string {

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
                FunctionStatement: (funcStmt) => {
                    if (!this.isAsyncTask(funcStmt)) {
                        return
                    }

                    acc.add(funcStmt)
                },
            }), {
                walkMode: WalkMode.visitStatements
            });

            return acc
        }, new Set<FunctionStatement>());

        const enumItems = Array.from(asyncTasks).map((task) => {
            return `${this.getFunctionName(task)} = "${this.getTaskName(task)}"`
        })

        const content = 'enum Tasks\n    ' + enumItems.join('\n    ') + '\nend enum\n';

        program.setFile('source/AsyncTask/Tasks.bs', content);
    }
}

export default () => {
    return new AsyncTaskPlugin();
};
