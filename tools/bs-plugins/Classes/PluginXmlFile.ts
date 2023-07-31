import { XmlFile } from "brighterscript";
import { SGField, SGFunction, SGNode, SGScript } from "brighterscript/dist/parser/SGTypes";
import { parseString, Builder } from 'xml2js'

export class PluginXmlFile {
    private file: XmlFile;
    public parsed?: { component: any };

    constructor(xmlFile: XmlFile) {
        this.file = xmlFile;
    }

    public parse() {
        parseString(this.file.fileContents, (err, res) => {
            if (err) {
                throw err;
            }
            this.parsed = res;
        });
    }

    public stringify(): string {
        const builder = new Builder();
        return builder.buildObject(this.parsed);
    }

    public addScripts(scripts: SGScript[]) {
        if (scripts.length === 0 || !this.parsed) {
            return;
        }

        if (!this.parsed.component.script) {
            this.parsed.component.script = [];
        }

        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            const attributes = script.attributes.reduce((acc, attr) => {
                acc[attr.key.text] = attr.value.text;
                return acc;
            }, {} as any);
            this.parsed.component.script.push({
                $: attributes,
            });
        }

        this.parsed.component.script = this.parsed.component.script.reduce((acc: any[], script: any) => {
            if (acc.find((item) => item.$.uri === script.$.uri)) {
                return acc;
            }
            acc.push(script);
            return acc;
        }, []);
    }

    public addFields(fields: SGField[]) {
        if (fields.length === 0 || !this.parsed) {
            return;
        }

        if (!this.parsed.component.interface || this.parsed.component.interface.length === 0) {
            this.parsed.component.interface = [{}];
        }

        if (!this.parsed.component.interface[0].field) {
            this.parsed.component.interface[0].field = [];
        }

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const attributes = field.attributes.reduce((acc, attr) => {
                acc[attr.key.text] = attr.value.text;
                return acc;
            }, {} as any);
            this.parsed.component.interface[0].field.push({
                $: attributes,
            });
        }
    }

    public addFunctions(functions: SGFunction[]) {
        if (functions.length === 0 || !this.parsed) {
            return;
        }

        if (!this.parsed.component.interface || this.parsed.component.interface.length === 0) {
            this.parsed.component.interface = [{}];
        }

        if (!this.parsed.component.interface[0].function) {
            this.parsed.component.interface[0].function = [];
        }

        for (let i = 0; i < functions.length; i++) {
            const func = functions[i];
            const attributes = func.attributes.reduce((acc, attr) => {
                acc[attr.key.text] = attr.value.text;
                return acc;
            }, {} as any);
            this.parsed.component.interface[0].function.push({
                $: attributes,
            });
        }
    }

    public addChildren(includeFile: XmlFile) {
        if (!this.parsed || !this.parsed.component) {
            return;
        }

        if (!this.parsed.component.children || this.parsed.component.children.length === 0) {
            this.parsed.component.children = [{}];
        }

        const includeXml = new PluginXmlFile(includeFile);
        includeXml.parse();

        if (!includeXml.parsed || !includeXml.parsed.component || !includeXml.parsed.component.children || !includeXml.parsed.component.length) {
            return;
        }

        const mergedChildren: { [key: string]: any } = {};
        for (let key in this.parsed.component.children[0]) {
            if (Array.isArray(this.parsed.component.children[0][key]) && Array.isArray(includeXml.parsed.component.children[0][key])) {
                mergedChildren[key] = includeXml.parsed.component.children[0][key].concat(this.parsed.component.children[0][key]);
            } else {
                mergedChildren[key] = this.parsed.component.children[0][key];
            }
        }
        for (let key in includeXml.parsed.component.children[0]) {
            if (!mergedChildren.hasOwnProperty(key)) {
                mergedChildren[key] = includeXml.parsed.component.children[0][key];
            }
        }

        this.parsed.component.children[0] = mergedChildren;
    }
}