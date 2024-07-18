// This plugin enforces regex based validation rules on BrightScript files.
// Rules are defined in the `validation` property of the `bsconfig.json` file.

import {
    BeforeProgramValidateEvent,
    BscFile,
    CompilerPlugin,
    DiagnosticSeverity,
    OnFileValidateEvent,
    Range,
    isBrsFile
} from 'brighterscript';

type Validation = {
    code: number | string | undefined;
    regex: string;
    regexFlags?: string;
    message: string;
}

export class ValidationPlugin implements CompilerPlugin {
    public name = 'ValidationPlugin';

    onFileValidate(event: OnFileValidateEvent<BscFile>) {
        const file = event.file;
        if (!isBrsFile(file)) {
            return;
        }

        // @ts-ignore
        const validation = event.program.options.validation as Validation[] | undefined;
        if (!validation) {
            return;
        }

        event.program.diagnostics.clearByFilter({ file: file, tag: this.name });

        validation.forEach((validation) => {
            const regex = new RegExp(validation.regex, validation.regexFlags);
            const fileContents = file.fileContents;

            let match: RegExpExecArray | null;
            while ((match = regex.exec(fileContents)) !== null) {
                const line = fileContents.substring(0, match.index).split('\n').length - 1;
                const column = match.index - fileContents.lastIndexOf('\n', match.index) - 1;

                event.program.diagnostics.register({
                    file: file,
                    range: Range.create(line, column, line, column + match[0].length),
                    message: validation.message,
                    code: validation.code,
                    severity: DiagnosticSeverity.Error
                }, { tags: [this.name] });
            }
        });
    }
}

export default () => {
    return new ValidationPlugin();
};
