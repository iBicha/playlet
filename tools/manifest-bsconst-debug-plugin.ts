import {
    CompilerPlugin,
    ProgramBuilder
} from 'brighterscript';
import path from 'path';
import fs from 'fs';

export class ManifestBsConstDebugPlugin implements CompilerPlugin {
    public name = 'manifestBsConstDebugPlugin';

    private originalManifestContent?: string;

    beforeProgramCreate(builder: ProgramBuilder) {
        const debugFlag = process.argv.find(arg => /--debug=(true|false)/i.test(arg))
        if (!debugFlag) {
            return;
        }
        const value = /--debug=(true|false)/i.exec(debugFlag)![1].toLowerCase()
        builder.logger.log(`Setting bs_const DEBUG to ${value}`)
        const manifestPath = path.join(builder.options.rootDir!, "manifest")
        this.originalManifestContent = fs.readFileSync(manifestPath, { encoding: 'utf8', flag: 'r' })
        let manifestContent = this.originalManifestContent.replace(/DEBUG=(true|false)/i, `DEBUG=${value}`);
        fs.writeFileSync(manifestPath, manifestContent)
    }

    afterPublish(builder: ProgramBuilder) {
        if (!this.originalManifestContent) {
            return
        }
        const manifestPath = path.join(builder.options.rootDir!, "manifest")
        fs.writeFileSync(manifestPath, this.originalManifestContent!)
    }
}

export default () => {
    return new ManifestBsConstDebugPlugin();
};
