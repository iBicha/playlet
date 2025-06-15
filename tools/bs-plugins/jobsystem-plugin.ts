// This plugin generates a job component for each function annotated with @job

import {
    CompilerPlugin,
    BscFile,
    isBrsFile,
    WalkMode,
    createVisitor,
    Program,
    FunctionStatement,
    DiagnosticSeverity,
} from 'brighterscript';

export class JobSystemPlugin implements CompilerPlugin {
    public name = 'JobSystemPlugin';

    afterFileParse(file: BscFile) {
        if (!isBrsFile(file)) {
            return
        }

        const program = file.program

        file.ast.walk(createVisitor({
            FunctionExpression: (func) => {
                const jobName = this.getJobName(func.functionStatement);
                if (!jobName) {
                    return
                }

                const xml = this.generateJobXml(jobName, file.pkgPath)
                const xmlFile = `components/JobSystem/generated/${jobName}.xml`

                if (program.hasFile(xmlFile)) {
                    const currentContent = program.getFile(xmlFile).fileContents
                    if (currentContent !== xml) {
                        file.addDiagnostics([{
                            file: file,
                            range: func.range,
                            message: `JobSystemPlugin: file ${xmlFile} already exists`,
                            severity: DiagnosticSeverity.Error,
                            code: 'JOB_SYSTEM_FILE_EXISTS',
                        }]);
                    }
                }
                file.program.setFile(xmlFile, xml)
            },
        }), {
            walkMode: WalkMode.visitExpressionsRecursive
        });
    }

    beforeProgramValidate(program: Program) {
        this.generateJobListEnum(program);
    }

    getJobName(functionStatement: FunctionStatement | undefined): string | null {
        const annotations = functionStatement?.annotations
        if (!annotations || annotations.length === 0) {
            return null;
        }
        for (let index = 0; index < annotations.length; index++) {
            const annotation = annotations[index];
            if (annotation.name === "job") {
                const annotationArgs = annotation.getArguments();
                if (annotationArgs && annotationArgs.length > 0) {
                    return annotationArgs[0] as string;
                }
            }
        }
        return null;
    }

    generateJobXml(jobName: string, bsFile: string): string {
        return `<?xml version="1.0" encoding="UTF-8" ?>
<component name="${jobName}" extends="BaseJob">
    <script type="text/brightscript" uri="pkg:/${bsFile}" />
</component>`
    }

    generateJobListEnum(program: Program) {
        const jobNames = Object.values(program.files).reduce((acc, file) => {
            if (!isBrsFile(file)) {
                return acc
            }

            file.ast.walk(createVisitor({
                FunctionExpression: (func) => {
                    const jobName = this.getJobName(func.functionStatement);
                    if (!jobName) {
                        return
                    }

                    acc.add(jobName)
                },
            }), {
                walkMode: WalkMode.visitExpressionsRecursive
            });

            return acc
        }, new Set<string>());
        if (jobNames.size === 0) {
            return;
        }

        const enumItems = Array.from(jobNames).map((jobName) => {
            return `${jobName} = "${jobName}"`
        })

        const content = 'enum Jobs\n    ' + enumItems.join('\n    ') + '\nend enum\n';

        program.setFile('components/JobSystem/Jobs.bs', content);
    }
}

export default () => {
    return new JobSystemPlugin();
};
