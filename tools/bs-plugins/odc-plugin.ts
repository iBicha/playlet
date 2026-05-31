// Plugin to inject the roku-test-automation On-Device Component (ODC) into the app.
// When included in a bsconfig, this plugin:
//  1. Replaces the `vscode_rdb_on_device_component_entry` magic comment in staged Main.brs
//     with RTA_OnDeviceComponent creation (same injection point VS Code uses)
//  2. Copies RTA device component files into the staging directory
//
// Gating: this plugin is a no-op unless ALL of the following are true:
//  - `options.debug` is set (i.e. this is a `--debug` build — dev or e2e, never prod).
//  - The staged tree contains `source/Main.brs` (i.e. this is an app build, not a lib build).
//  - That Main.brs contains the `' vscode_rdb_on_device_component_entry` magic comment.
// This makes it safe to enable globally in `config/bsconfig.base.jsonc` — prod builds
// drop the ODC because they're not `--debug`, and the lib build is skipped because it
// has no Main.brs.
import {
    CompilerPlugin,
    FileObj,
    ProgramBuilder,
} from 'brighterscript';
import path from 'path';
import fs from 'fs';

function copyDirSync(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const ODC_MAGIC_COMMENT = `' vscode_rdb_on_device_component_entry`;
const ODC_REPLACEMENT = `if true = CreateObject("roAppInfo").IsDev() then m.vscode_rdb_odc_node = createObject("roSGNode", "RTA_OnDeviceComponent") ' RDB OnDeviceComponent`;

export class OdcPlugin implements CompilerPlugin {
    public name = 'OdcPlugin';

    afterPublish(builder: ProgramBuilder, _files: FileObj[]) {
        const logger = builder.logger;
        const stagingDir = builder.options.stagingDir!;

        // @ts-ignore - `debug` is a valid bsc option; the type may not surface it.
        const debug = !!builder.options.debug;
        if (!debug) {
            logger.info(this.name, 'Skipping ODC injection — not a --debug build.');
            return;
        }

        const mainBrsPath = path.join(stagingDir, 'source', 'Main.brs');
        if (!fs.existsSync(mainBrsPath)) {
            // Library / non-app build: no Main.brs to inject into.
            logger.info(this.name, `Skipping ODC injection — no source/Main.brs in ${stagingDir}.`);
            return;
        }

        const original = fs.readFileSync(mainBrsPath, 'utf-8');
        if (!original.includes(ODC_MAGIC_COMMENT)) {
            logger.warn(this.name, 'Magic comment not found in Main.brs — RTA_OnDeviceComponent not injected.');
            return;
        }

        // 1. Inject RTA_OnDeviceComponent via the magic comment in staged Main.brs.
        fs.writeFileSync(mainBrsPath, original.replace(ODC_MAGIC_COMMENT, ODC_REPLACEMENT));
        logger.info(this.name, 'Injected RTA_OnDeviceComponent into Main.brs');

        // 2. Copy RTA device files into staging.
        const rtaPackageDir = path.dirname(
            require.resolve('roku-test-automation/package.json')
        );
        const rtaDevicePath = path.join(rtaPackageDir, 'device');

        if (fs.existsSync(rtaDevicePath)) {
            logger.info(this.name, `Copying RTA device files from ${rtaDevicePath} to ${stagingDir}`);
            copyDirSync(rtaDevicePath, stagingDir);
        } else {
            logger.error(this.name, `RTA device files not found at ${rtaDevicePath}`);
        }
    }
}

export default () => {
    return new OdcPlugin();
};
