// This plugin validates missing imports in bs files
// The idea is for each script, create a dummy component that only imports the script
// Then the linter will detect if there are undefined symbols not imported in the component.
// There are some false positives, and the approach is "weird", but it works for now.
// Plugin not used by default.

import {
    BscFile,
    CompilerPlugin,
    isBrsFile,
} from 'brighterscript';
import { existsSync } from 'fs-extra';

export class ImportValidationPlugin implements CompilerPlugin {
    public name = 'ImportValidationPlugin';

    afterFileParse(file: BscFile) {
        if (!isBrsFile(file)) {
            return
        }

        // Skip generated files
        if (!existsSync(file.srcPath)) {
            return;
        }

        this.generateXmlComponent(file);
    }

    generateXmlComponent(file: BscFile) {
        const path = file.pkgPath;
        const name = path.split('/').pop().replace('.bs', '') + `TestComponent${path.length}`;
        const content = `<component name="${name}" extends="Node">
<script type="text/brightscript" uri="pkg:/${file.pkgPath}" />
</component>`

        file.program.setFile(`${path}.TestComponent.xml`, content);
    }
}

export default () => {
    return new ImportValidationPlugin();
};
