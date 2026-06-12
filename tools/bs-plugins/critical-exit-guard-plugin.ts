import { CompilerPlugin, ProgramBuilder } from 'brighterscript';

// A plugin that fails to load (e.g. a TypeScript error in its file) is only logged
// by bsc and the build continues without it, exiting 0 (rokucommunity/brighterscript#1675).
// Listed last in the plugins array, this guard fails the command when any configured
// plugin is missing from the loaded set. It deliberately imports nothing from the
// other plugin files, so it still loads when one of them is broken.
const exitOnError = !!process.env.npm_lifecycle_event && !process.argv.includes('--lsp');

export class CriticalExitGuardPlugin implements CompilerPlugin {
    public name = 'CriticalExitGuardPlugin';

    beforeProgramCreate(builder: ProgramBuilder) {
        if (!exitOnError) {
            return;
        }
        const configured = (builder as any)?.options?.plugins?.length ?? 0;
        const loaded = (builder as any)?.plugins?.plugins?.length ?? 0;
        if (loaded < configured) {
            console.error(`${configured - loaded} of ${configured} configured plugins failed to load (see "Error when loading plugin" above)`);
            process.exit(1);
        }
    }
}

export default () => {
    return new CriticalExitGuardPlugin();
};
