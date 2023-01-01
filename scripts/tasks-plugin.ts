import {
    CompilerPlugin,
    BscFile,
    BeforeFileTranspileEvent,
    isBrsFile,
    WalkMode,
    createVisitor,
    DiagnosticSeverity
} from 'brighterscript';

export class AsyncTaskPlugin implements CompilerPlugin {
    public name = 'asyncTaskPlugin';

    beforeFileTranspile(event: BeforeFileTranspileEvent) {
        if (!isBrsFile(event.file)) {
            return
        }
        event.file.ast.walk(createVisitor({
            FunctionExpression: (func) => {
                const annotations = func.functionStatement?.annotations
                if (!annotations || annotations.length === 0) {
                    return
                }
                if (annotations[0].name !== "asynctask") {
                    return
                }
                const functionName = func.functionStatement!.name.text
                const hasParams = func.functionStatement!.func.parameters.length > 0
                const taskName = `${functionName}_asynctask`

                const bs = this.generateBsTask(functionName, hasParams, event.file)
                const bsFile = `components/asynctasks/generated/${taskName}.bs`

                const xml = this.generateXmlTask(taskName, bsFile)
                const xmlFile = `components/asynctasks/generated/${taskName}.xml`

                if (event.program.hasFile(xmlFile) || event.program.hasFile(bsFile)) {
                    event.program.addDiagnostics([{
                        message: `Duplicate async task ${functionName}, use a different name`,
                        range: annotations[0].nameToken.range,
                        file: event.file,
                        severity: DiagnosticSeverity.Error,
                    }])
                }

                event.program.setFile(xmlFile, xml)
                event.program.setFile(bsFile, bs)
            },
        }), {
            walkMode: WalkMode.visitExpressionsRecursive
        });
    }

    generateBsTask(functionName: string, hasInput: boolean, file: BscFile): string {
        return `
import "pkg:/${file.pkgPath}"

function Init()
    m.top.functionName = "TaskMain"
end function

function TaskMain()
    try
        result = ${functionName}(${(hasInput ? "m.top.input" : "")})
        m.top.setField("output", {
            success: true,
            result: result
        })
    catch e
        m.top.setField("output", {
            success: false,
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
  </interface>
  <script type="text/brightscript" uri="pkg:/${bsFile}" />
</component>`
    }
}

export default () => {
    return new AsyncTaskPlugin();
};
