// This plugin keeps track of transpiled files and keeps them in the src files, for testing purposes
// This plugin only runs when the --test-mode flag
//
// - Any folder ending in .transpiled will contain the transpiled files. .map files are ignored.
//   - Example: src/components/tests.transpiled will contain transpiled files for src/components/tests
// - Any file ending in .transpiled.* will contain the transpiled file
//   - Example: src/components/tests.transpiled.brs will contain the transpiled file for src/components/tests.bs
//   - Example: src/components/tests.transpiled.xml will contain the transpiled file for src/components/tests.xml
//
// Tracking transpilied files acts as living tests for plugins. When plugins are modified, unexpected changes
// Can be caught by inspecting the diff in the transpiled files.

import {
    CompilerPlugin, FileObj, ProgramBuilder,
} from 'brighterscript';
import { globSync } from "glob";
import path from 'path';
import fs from 'fs-extra'

export class TrackTranspiledPlugin implements CompilerPlugin {
    public name = 'TrackTranspiledPlugin';

    afterPublish(builder: ProgramBuilder, files: FileObj[]) {
        // @ts-ignore 
        if (!builder.options.testMode) {
            return;
        }

        const stagingDir = builder.options.stagingDir!;
        const rootDir = builder.rootDir;

        const transpiledFolders = globSync('**/*.transpiled', { cwd: rootDir });
        for (let i = 0; i < transpiledFolders.length; i++) {
            const folder = transpiledFolders[i];
            const srcFolder = path.join(rootDir, folder);

            fs.emptyDirSync(srcFolder);

            const stagingFolder = path.join(stagingDir, folder).replace(".transpiled", "");
            if (fs.existsSync(stagingFolder)) {
                const files = globSync('**', { cwd: stagingFolder, nodir: true }).filter(file => !file.endsWith('.map'));
                files.forEach(file => {
                    const stagingFile = path.join(stagingFolder, file);
                    const srcFile = path.join(srcFolder, file);
                    fs.copySync(stagingFile, srcFile)
                });
            }
        }

        const transpiledFiles = globSync('**/*.transpiled.*', { cwd: rootDir });
        for (let i = 0; i < transpiledFiles.length; i++) {
            const file = transpiledFiles[i];
            const srcFile = path.join(rootDir, file);
            fs.rmSync(srcFile, { force: true });

            const stagingFile = path.join(stagingDir, file)
                .replace(".transpiled", "")
                .replace(".bs", ".brs");
            if (fs.existsSync(stagingFile)) {
                fs.copySync(stagingFile, srcFile)
            }
        }
    }
}

export default () => {
    return new TrackTranspiledPlugin();
};
