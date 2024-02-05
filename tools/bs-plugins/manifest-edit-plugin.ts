// Plugin to edit the manifest file before the build, and restore it after publishing
//  - --debug would set the DEBUG flag to true in the manifest file (otherwise false)
//    - This is to make sure stuff in #IF DEBUG would not get stripped out by brighterscript
//  - --test-mode would comment out the sg_component_libs_provided line in the manifest file
//    - This allows Playlet-lib to be tested independently
//  - DEBUG_HOST_IP_ADDRESS would be replaced with the host IP address in the manifest file
//    - This is to playlet app to pull playlet lib from the locally hosted server
//    - This is only done when --debug is set

import {
    BeforeProgramDisposeEvent,
    CompilerPlugin,
    Program,
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
        let originalManifestContent = fs.readFileSync(manifestPath, { encoding: 'utf8', flag: 'r' })

        let manifestContent = originalManifestContent;

        // Debug flag
        // @ts-ignore
        const debug = !!builder.options.debug;
        builder.logger.log(`Setting bs_const DEBUG to ${debug}`)
        manifestContent = manifestContent.replace(/DEBUG=(true|false)/i, `DEBUG=${debug}`);

        if (debug) {
            // Host IP address
            manifestContent = manifestContent.replace(/DEBUG_HOST_IP_ADDRESS/i, `${ip.address()}`)
        }

        // Test flag
        // @ts-ignore
        const testMode = !!builder.options.testMode;
        if (testMode) {
            builder.logger.log(`Commenting out "sg_component_libs_provided"`)
            manifestContent = manifestContent.replace(/sg_component_libs_provided=/i, `# sg_component_libs_provided=`);
        }

        this.originalManifestContent = originalManifestContent;
        builder.logger.info(this.name, 'Writing manifest file: ' + manifestPath);
        fs.writeFileSync(manifestPath, manifestContent)
    }

    afterPublish(builder: ProgramBuilder) {
        this.restoreManifest(builder.program!);
    }

    beforeProgramDispose(event: BeforeProgramDisposeEvent) {
        this.restoreManifest(event.program);
    }

    restoreManifest(program: Program) {
        if (!this.originalManifestContent) {
            return
        }

        const manifestPath = path.join(program.options.rootDir!, "manifest")
        program.logger.info(this.name, 'Restoring manifest: ' + manifestPath);
        fs.writeFileSync(manifestPath, this.originalManifestContent)

        this.originalManifestContent = undefined;
    }
}

export default () => {
    return new ManifestEditPlugin();
};
