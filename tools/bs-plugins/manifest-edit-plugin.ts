// Plugin to edit the manifest file before the build, and restore it after publishing
//  - --debug would set the DEBUG flag to true in the manifest file (otherwise false)
//    - This is to make sure stuff in #IF DEBUG would not get stripped out by brighterscript
//  - --test-mode would comment out the sg_component_libs_provided line in the manifest file
//    - This allows Playlet-lib to be tested independently
//  - DEBUG_HOST_IP_ADDRESS would be replaced with the host IP address in the manifest file
//    - This is to playlet app to pull playlet lib from the locally hosted server
//    - This is only done when --debug is set
//  - PLAYLET_DEVTOOLS (env) instead points playlet_lib_zip_debug_url at the dev-tools service:
//    the freshly-built lib zip is registered with it and its URL baked in, so rebuilding the lib
//    and relaunching hot-reloads it with no app redeploy. Opt-in; only the app manifest has the
//    key, so the lib build and every normal build keep the :8086 host the VSCode launch serves.

import {
    BeforeProgramDisposeEvent,
    CompilerPlugin,
    Program,
    ProgramBuilder
} from 'brighterscript';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';
import { exitOnCriticalErrors } from './critical-exit';
const ip = require('ip');

export class ManifestEditPlugin implements CompilerPlugin {
    public name = 'ManifestEditPlugin';

    private originalManifestContent?: string;

    beforeProgramCreate(builder: ProgramBuilder) {
        // The language server loads this plugin too (VS Code + bsc-lsp), and its revalidate cycle would
        // restore a stale cached copy of the manifest over genuine build edits. The LSP builds no-emit
        // with showDiagnosticsInConsole off (it reports over the protocol); builds and bslint leave it
        // on. So that flag marks the analysis-only editor pass — skip the manifest rewrite there.
        // @ts-ignore
        if (builder.options.showDiagnosticsInConsole === false) {
            return;
        }

        const manifestPath = path.join(builder.options.rootDir!, "manifest")
        let originalManifestContent = fs.readFileSync(manifestPath, { encoding: 'utf8', flag: 'r' })

        let manifestContent = originalManifestContent;

        // Debug flag
        // @ts-ignore
        const debug = !!builder.options.debug;
        builder.logger.log(`Setting bs_const DEBUG to ${debug}`)
        manifestContent = manifestContent.replace(/DEBUG=(true|false)/i, `DEBUG=${debug}`);

        if (debug) {
            // dev-tools service hosts the lib (opt-in via PLAYLET_DEVTOOLS); the key lives only in
            // the app manifest, so the lib build and normal builds fall through to the :8086 host.
            if (process.env.PLAYLET_DEVTOOLS && /playlet_lib_zip_debug_url=/.test(manifestContent)) {
                const serveScript = path.resolve(builder.options.rootDir!, '../../../../dev-tools/bin/serve.sh')
                const libZip = path.resolve(builder.options.rootDir!, '../../dist/playlet-lib.zip')
                let url: string
                try {
                    url = execFileSync(serveScript, ['add', libZip], { encoding: 'utf8' }).trim()
                } catch (err: any) {
                    throw new Error(`Could not host ${libZip} via the dev-tools service (is it running? cd dev-tools && npm start): ${err?.message ?? err}`)
                }
                builder.logger.log(`Hosting playlet-lib.zip via dev-tools service: ${url}`)
                manifestContent = manifestContent.replace(/playlet_lib_zip_debug_url=.*/i, `playlet_lib_zip_debug_url=${url}`)
            } else {
                // Host IP address
                manifestContent = manifestContent.replace(/DEBUG_HOST_IP_ADDRESS/i, `${ip.address()}`)
            }
        }

        // Test flag
        // @ts-ignore
        const testMode = !!builder.options.testMode;
        builder.logger.log(`Setting bs_const TEST_MODE to ${testMode}`)
        manifestContent = manifestContent.replace(/TEST_MODE=(true|false)/i, `TEST_MODE=${testMode}`);
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
    return exitOnCriticalErrors(new ManifestEditPlugin());
};
