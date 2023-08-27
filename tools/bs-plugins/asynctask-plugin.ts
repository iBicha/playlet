// This plugin generates a task component for each function annotated with @asynctask

import {
    CompilerPlugin,
    BscFile,
    BeforeFileTranspileEvent,
    isBrsFile,
    WalkMode,
    createVisitor,
    DiagnosticSeverity,
    Program,
    FunctionStatement,
    BeforeFileValidateEvent,
} from 'brighterscript';

declare type FunctionInFile = {
    functionStatement: FunctionStatement,
    file: BscFile
}

export class AsyncTaskPlugin implements CompilerPlugin {
    public name = 'AsyncTaskPlugin';

    private asyncTaskFunctions: FunctionInFile[] = []
    private duplicatesReporeted: FunctionInFile[] = []

    beforeProgramValidate(program: Program) {
        this.asyncTaskFunctions = []
        this.duplicatesReporeted = []
    }

    beforeFileValidate(event: BeforeFileValidateEvent) {
        if (!isBrsFile(event.file)) {
            return
        }
        event.file.ast.walk(createVisitor({
            FunctionExpression: (func) => {
                if (!this.isAsyncTask(func.functionStatement)) {
                    return
                }

                this.asyncTaskFunctions.push({
                    file: event.file,
                    functionStatement: func.functionStatement!
                })
            },
        }), {
            walkMode: WalkMode.visitExpressionsRecursive
        });
    }

    afterFileValidate(file: BscFile) {
        if (!isBrsFile(file)) {
            return
        }

        const functionsWithDuplicates = this.getFunctionsWithDuplicatesForFile(file);

        for (let index = 0; index < functionsWithDuplicates.length; index++) {
            const fn = functionsWithDuplicates[index];
            if (this.duplicatesReporeted.indexOf(fn) !== -1) {
                continue
            }
            file.addDiagnostics([{
                code: 6661,
                message: `Duplicate async task '${fn.functionStatement.name.text}', use a different function name`,
                range: fn.functionStatement.range,
                file: fn.file,
                source: "AsyncTaskPlugin",
                severity: DiagnosticSeverity.Error,
            }])
            this.duplicatesReporeted.push(fn)
        }
    }

    beforeFileTranspile(event: BeforeFileTranspileEvent) {
        if (!isBrsFile(event.file)) {
            return
        }

        const functions = this.asyncTaskFunctions
            .filter((fn) => fn.file === event.file)

        if (functions.length === 0) {
            return
        }

        event.file.ast.walk(createVisitor({
            FunctionExpression: (func) => {
                if (!this.isAsyncTask(func.functionStatement)) {
                    return
                }

                const functionName = func.functionStatement!.name.text
                const hasParams = func.functionStatement!.func.parameters.length > 0
                const taskName = `${functionName}_asynctask`

                const bs = this.generateBsTask(functionName, hasParams, event.file)
                const bsFile = `components/asynctasks/generated/${taskName}.bs`

                const xml = this.generateXmlTask(taskName, bsFile)
                const xmlFile = `components/asynctasks/generated/${taskName}.xml`

                event.program.setFile(xmlFile, xml)
                event.program.setFile(bsFile, bs)
            },
        }), {
            walkMode: WalkMode.visitExpressionsRecursive
        });
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

    getFunctionsWithDuplicatesForFile(filterFile: BscFile) {
        const fileFunctions = this.asyncTaskFunctions
            .filter((fn) => fn.file === filterFile)

        if (fileFunctions.length === 0) {
            return []
        }

        const uniqueNames: { [name: string]: FunctionInFile | undefined } = {}
        const duplicatesNames: { [name: string]: boolean } = {}
        const duplicates: FunctionInFile[] = []

        for (var i = 0; i < this.asyncTaskFunctions.length; i++) {
            const fnName = this.asyncTaskFunctions[i].functionStatement.name.text.toLowerCase()
            if (duplicatesNames[fnName]) {
                duplicates.push(this.asyncTaskFunctions[i])
                continue
            }

            if (uniqueNames[fnName]) {
                duplicates.push(uniqueNames[fnName]!)
                uniqueNames[fnName] = undefined
                duplicatesNames[fnName] = true
                duplicates.push(this.asyncTaskFunctions[i])
                continue
            }

            uniqueNames[fnName] = this.asyncTaskFunctions[i]
        }

        return duplicates
    }

    generateBsTask(functionName: string, hasInput: boolean, file: BscFile): string {
        return `
import "pkg:/${file.pkgPath}"

function Init()
    m.top.functionName = "TaskMain"
    m.top.cancellation = {
        node: m.top,
        field: "cancel",
        value: true
    }
end function

function TaskMain()
    try
        result = ${functionName}(${(hasInput ? "m.top.input" : "")})
        m.top.setField("output", {
            success: true,
            task: m.top,
            cancelled: m.top.cancel,
            result: result
        })
    catch e
        #if DEBUG
            print "ERROR in ${functionName}: "
            print FormatJson(e)
        #end if
        m.top.setField("output", {
            success: false,
            task: m.top,
            cancelled: m.top.cancel,
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
  <script type="text/brightscript" uri="pkg:/${bsFile}" />
</component>`
    }
}

export default () => {
    return new AsyncTaskPlugin();
};
