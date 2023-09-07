// This plugin enforces regex based validation rules on BrightScript files.
// Rules are defined in the `validation` property of the `bsconfig.json` file.

import {
    BscFile,
    CompilerPlugin,
    OnFileValidateEvent,
    Program,
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

    private validation?: Validation[];

    beforeProgramValidate(program: Program) {
        // @ts-ignore
        this.validation = program.options.validation as Validation[] | undefined;
    }

    onFileValidate(event: OnFileValidateEvent<BscFile>) {
        const file = event.file;

        if (!this.validation || !isBrsFile(file)) {
            return;
        }

        this.validation.forEach((validation) => {
            const regex = new RegExp(validation.regex, validation.regexFlags);
            const fileContents = file.fileContents;

            let match: RegExpExecArray | null;
            while ((match = regex.exec(fileContents)) !== null) {
                const line = fileContents.substring(0, match.index).split('\n').length - 1;
                const column = match.index - fileContents.lastIndexOf('\n', match.index) - 1;
                file.diagnostics.push({
                    code: validation.code,
                    message: validation.message,
                    file: file,
                    range: Range.create(line, column, line, column + match[0].length)
                });
            }
        });
    }
}

export default () => {
    return new ValidationPlugin();
};
