import {
    CompilerPlugin,
    ProgramBuilder,
    FileObj
} from 'brighterscript';
import path from 'path';
import fs from 'fs';

export class ManifestBsConstDebugPlugin implements CompilerPlugin {
    public name = 'manifestBsConstDebugPlugin';

    beforePublish(builder: ProgramBuilder, files: FileObj[]) {
        const debugFlag = process.argv.find(arg => /--debug=(true|false)/i.test(arg))
        if (!debugFlag) {
            return;
        }
        const value = /--debug=(true|false)/i.exec(debugFlag)![1].toLowerCase()
        builder.logger.log(`Setting bs_const DEBUG to ${value}`)
        const manifestPath = path.join(builder.options.stagingDir!, "manifest")
        let manifestContent = fs.readFileSync(manifestPath, { encoding: 'utf8', flag: 'r' })
        manifestContent = manifestContent.replace(/DEBUG=(true|false)/i, `DEBUG=${value}`);
        fs.writeFileSync(manifestPath, manifestContent)
    }
}

export default () => {
    return new ManifestBsConstDebugPlugin();
};
