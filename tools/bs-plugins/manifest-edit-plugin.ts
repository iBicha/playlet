import {
    CompilerPlugin,
    ProgramBuilder
} from 'brighterscript';
import path from 'path';
import fs from 'fs';
const ip = require('ip');

export class ManifestEditPlugin implements CompilerPlugin {
    public name = 'ManifestEditPlugin';

    private originalManifestContent?: string;

    beforeProgramCreate(builder: ProgramBuilder) {
        const manifestPath = path.join(builder.options.rootDir!, "manifest")
        this.originalManifestContent = fs.readFileSync(manifestPath, { encoding: 'utf8', flag: 'r' })

        let manifestContent = this.originalManifestContent;

        // Debug flag
        const debugFlag = process.argv.find(arg => /--debug=(true|false)/i.test(arg))
        if (debugFlag) {
            const value = /--debug=(true|false)/i.exec(debugFlag)![1].toLowerCase()
            builder.logger.log(`Setting bs_const DEBUG to ${value}`)
            manifestContent = manifestContent.replace(/DEBUG=(true|false)/i, `DEBUG=${value}`);
        }

        // Test flag
        const testFlag = process.argv.find(arg => /--test-mode=(true|false)/i.test(arg))
        if (testFlag) {
            const value = /--test-mode=(true|false)/i.exec(testFlag)![1].toLowerCase()
            if (value === 'true') {
                builder.logger.log(`Commenting out "sg_component_libs_provided"`)
            }
            manifestContent = manifestContent.replace(/sg_component_libs_provided=/i, `# sg_component_libs_provided=`);
        }

        // Host IP address
        manifestContent = manifestContent.replace(/DEBUG_HOST_IP_ADDRESS/i, `${ip.address()}`)

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
    return new ManifestEditPlugin();
};
