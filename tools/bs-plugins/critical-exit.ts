import { Plugin } from 'brighterscript';

// bsc catches plugin exceptions and only logs them (rokucommunity/brighterscript#1675),
// so a crashing plugin still yields a passing build/lint. When running under an npm
// script (build, lint, test) an uncaught plugin error must fail the command, so every
// hook is wrapped to exit non-zero. Long-lived hosts (LSP) keep log-and-continue.
const exitOnError = !!process.env.npm_lifecycle_event && !process.argv.includes('--lsp');

export function exitOnCriticalErrors<T extends Plugin>(plugin: T): T {
    if (!exitOnError) {
        return plugin;
    }
    return new Proxy(plugin, {
        get(target, prop) {
            const value = (target as any)[prop];
            if (typeof value !== 'function') {
                return value;
            }
            return (...args: unknown[]) => {
                try {
                    const result = value.apply(target, args);
                    if (result instanceof Promise) {
                        return result.catch((err: unknown) => exitCritically(target.name, prop, err));
                    }
                    return result;
                } catch (err) {
                    exitCritically(target.name, prop, err);
                }
            };
        },
    });
}

function exitCritically(pluginName: string, hook: PropertyKey, err: unknown): never {
    console.error(`Plugin ${pluginName} failed in ${String(hook)}:`, err instanceof Error ? (err.stack || err.message) : err);
    process.exit(1);
}
