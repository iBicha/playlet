// This plugin validates locale files. It ensures that:
// 1. The English translations match the keys (key = value)
// 2. All keys in the locale enum have a translation
// 3. All translations from different languages have a corresponding key in the locale enum
// 4. Xml components do not have values that can be translated by accident
//   - an accidental translation can be a translated node id that's not supposed to be translated
//   - For that reason, only certain attributes (like "text" and "title") are allowed to have localized values

import {
    AfterFileValidateEvent,
    AfterProgramValidateEvent,
    BeforeProgramValidateEvent,
    BrsFile,
    CompilerPlugin,
    DiagnosticSeverity,
    EnumStatement,
    LiteralExpression,
    Program,
    Range,
    WalkMode,
    XmlFile,
    createVisitor,
    isBrsFile,
    isXmlFile
} from "brighterscript";
import { existsSync, readFileSync } from "fs";
import { join as pathJoin } from "path";
import * as xml2js from 'xml2js';
import { globSync } from 'glob';
import { SGNode } from "brighterscript/dist/parser/SGTypes";

const allowedXmlAttributes = ["text", "title", "primaryTitle", "displayText", "description"];

export class LocaleValidationPlugin implements CompilerPlugin {
    public name = 'LocaleValidationPlugin';

    private enums: { file: BrsFile, enumStatement: EnumStatement }[] = [];
    private localeValues: string[] = [];

    beforeProgramValidate(event: BeforeProgramValidateEvent) {
        this.enums = this.getEnumsWithLocaleAnnotation(event.program);
        if (this.enums.length === 0) {
            this.localeValues = [];
            return;
        }

        this.localeValues = this.getLocaleValues(this.enums);
    }

    afterFileValidate(event: AfterFileValidateEvent) {
        const file = event.file;
        const program = event.program;

        if (!isXmlFile(file)) {
            return;
        }

        if (this.enums.length === 0 || this.localeValues.length === 0) {
            return;
        }

        if (!file.ast.componentElement) {
            return;
        }

        program.diagnostics.clearByFilter({ file: file, tag: this.name });

        const localeValues = this.localeValues;
        const componentElement = file.ast.componentElement;
        const fields = componentElement.interfaceElement?.fields;
        const children = componentElement.childrenElement;

        if (fields) {
            fields.forEach((field) => {
                const value = field.value;
                if (value && localeValues.includes(value)) {
                    const id = field.id;
                    if (!allowedXmlAttributes.includes(id)) {
                        program.diagnostics.register({
                            file: file,
                            range: field.attributes.find((attr) => attr.key === 'value')?.tokens.value?.location?.range || field.tokens.startTagName.location!.range,
                            message: `Locale value found in xml component "${value}" but the attribute "${id}" is not allowed to be localized.`,
                            severity: DiagnosticSeverity.Error,
                            code: 'LOCALE_VALUE_IN_XML',
                        }, { tags: [this.name] });
                    }
                }
            });
        }

        if (children) {
            children.elements.forEach((child) => {
                this.validateSgNode(program, child, localeValues, file);
            });
        }
    }

    validateSgNode(program: Program, node: SGNode, localeValues: string[], file: XmlFile) {
        node.attributes.forEach((attribute) => {
            const value = attribute.value;
            if (value && localeValues.includes(value)) {
                const key = attribute.key;
                if (!allowedXmlAttributes.includes(key)) {
                    program.diagnostics.register({
                        file: file,
                        range: attribute.tokens.value!.location!.range,
                        message: `Locale value found in xml component: "${value}" but the attribute "${key}" is not allowed to be localized.`,
                        severity: DiagnosticSeverity.Error,
                        code: 'LOCALE_VALUE_IN_XML',
                    });
                }
            }
        });

        node.elements.forEach((child) => {
            this.validateSgNode(program, child, localeValues, file);
        });
    }

    afterProgramValidate(event: AfterProgramValidateEvent) {
        if (this.enums.length === 0 || this.localeValues.length === 0) {
            return;
        }

        const program = event.program;
        const uniqueLocaleValues = Array.from(new Set(this.localeValues));
        if (uniqueLocaleValues.length !== this.localeValues.length) {
            const duplicates = this.localeValues.filter((value, index) => this.localeValues.indexOf(value) !== index);

            program.diagnostics.register({
                file: this.enums[0].file,
                range: Range.create(0, 0, 0, 0),
                message: `Duplicate values in locale enums: ${duplicates.join(', ')}`,
                severity: DiagnosticSeverity.Error,
                code: 'LOCALE_DUPLICATE_VALUES',
            });
        }

        this.validateEnglishTranslations(program, this.localeValues, this.enums[0].file);

        const rootDir = program.options.rootDir!;
        const translationFiles = globSync(`locale/**/translations.ts`, { cwd: rootDir });
        translationFiles.forEach((translationFile) => {
            const srcPath = pathJoin(rootDir, translationFile);
            const xmlFile = new XmlFile({
                srcPath: srcPath,
                destPath: translationFile,
                program: program,
            });
            this.validateTranslations(xmlFile, program, this.localeValues, this.enums[0].file);
        });
    }

    validateTranslations(translationFile: XmlFile, program: Program, localeValues: string[], file: BrsFile) {
        const translations = this.loadTranslationsFile(program, translationFile);
        if (!translations) {
            return;
        }

        const missingKeys = Object.keys(translations).filter((key) => !localeValues.includes(key));
        if (missingKeys.length > 0) {

            program.diagnostics.register({
                file: file,
                range: Range.create(0, 0, 0, 0),
                message: `Missing keys in locale enum from ${translationFile.srcPath}: ${missingKeys.join(', ')}`,
                severity: DiagnosticSeverity.Error,
                code: 'LOCALE_MISSING_ENUM_KEYS',
            });
        }
    }

    validateEnglishTranslations(program: Program, localeValues: string[], file: BrsFile) {
        const translationFile = 'locale/en_US/translations.ts';
        const srcPath = pathJoin(program.options.rootDir!, translationFile);
        const xmlFile = new XmlFile({
            srcPath: srcPath,
            destPath: translationFile,
            program: program,
        });
        const englishTranslations = this.loadTranslationsFile(program, xmlFile);

        if (!englishTranslations) {
            return;
        }

        // keys and values of english translations must match (key = value)
        const mismatchedKeys = Object.keys(englishTranslations).filter((key) => englishTranslations[key] !== key);
        if (mismatchedKeys.length > 0) {
            const mismatchedTranslations = mismatchedKeys.map((key) => `${key}=${englishTranslations[key]}`);

            program.diagnostics.register({
                file: file,
                range: Range.create(0, 0, 0, 0),
                message: `Mismatched translations in en_US: ${mismatchedTranslations.join(', ')}`,
                severity: DiagnosticSeverity.Error,
                code: 'LOCALE_MISMATCHED_EN_TRANSLATIONS',
            });
        }

        const missingLocaleValues = localeValues.filter((value) => !englishTranslations[value]);
        if (missingLocaleValues.length > 0) {
            program.diagnostics.register({
                file: file,
                range: Range.create(0, 0, 0, 0),
                message: `Missing translations in en_US: ${missingLocaleValues.join(', ')}`,
                severity: DiagnosticSeverity.Error,
                code: 'LOCALE_MISSING_TRANSLATIONS',
            });

            const xml = missingLocaleValues.reduce((acc, value) => {
                acc += `<message>
    <source>${value}</source>
    <translation>${value}</translation>
</message>\n`;
                return acc;
            }, '');

            program.logger.error(`Add the following to en_US/translations.ts:\n${xml}`);
        }
    }

    loadTranslationsFile(program: Program, translationFile: XmlFile) {
        // load xml ts translation file
        if (!existsSync(translationFile.srcPath)) {
            return null;
        }
        const content = readFileSync(translationFile.srcPath, 'utf8');
        const xml = this.parseXml(content);
        if (!xml || !xml.TS || !xml.TS.context || !xml.TS.context[0].message) {
            return null;
        }

        return xml.TS.context[0].message.reduce((acc: any, message: any) => {
            const source = message.source[0];
            const translation = message.translation[0];

            if (acc[source]) {
                program.diagnostics.register({
                    file: translationFile,
                    range: Range.create(0, 0, 0, 0),
                    message: `Duplicate translation key: ${source}`,
                    severity: DiagnosticSeverity.Error,
                    code: 'LOCALE_DUPLICATE_TRANSLATION_KEY',
                });
            }

            acc[source] = translation;
            return acc;
        }, {} as Record<string, string>);
    }

    parseXml(text: string): any | null {
        let result = null;
        // parseString is actually a sync function
        xml2js.parseString(text, (err, data) => {
            if (err) {
                throw err;
            } else {
                result = data;
            }
        });
        return result;
    }

    getLocaleValues(enums: { file: BrsFile, enumStatement: EnumStatement }[]) {
        return enums.reduce((acc, e) => {
            e.enumStatement.walk(createVisitor({
                EnumMemberStatement: (enumMemberStatement) => {
                    const value = (enumMemberStatement.value as LiteralExpression).tokens.value.text;
                    if (!value.startsWith('"') || !value.endsWith('"')) {
                        e.file.program.diagnostics.register({
                            file: e.file,
                            range: enumMemberStatement.tokens.name.location.range,
                            message: `Locale value should be a string literal`,
                            severity: DiagnosticSeverity.Error,
                            code: 'LOCALE_VALUE_NOT_STRING_LITERAL',
                        });
                        return;
                    }
                    acc.push(value.slice(1, -1));
                }
            }), {
                walkMode: WalkMode.visitStatementsRecursive
            });
            return acc;
        }, [] as string[]);
    }

    getEnumsWithLocaleAnnotation(program: Program) {
        return Object.values(program.files).reduce((acc, file) => {
            if (!isBrsFile(file)) {
                return acc;
            }
            if (!file.fileContents.includes('@locale')) {
                return acc;
            }
            file.ast.walk(createVisitor({
                EnumStatement: (enumStatement) => {
                    if (this.isLocaleEnum(enumStatement)) {
                        acc.push({ file, enumStatement });
                    }
                },
            }), {
                walkMode: WalkMode.visitStatementsRecursive
            });
            return acc;
        }, [] as { file: BrsFile, enumStatement: EnumStatement }[]);
    }

    isLocaleEnum(enumStatement: EnumStatement | undefined) {
        const annotations = enumStatement?.annotations
        if (!annotations || annotations.length === 0) {
            return false
        }
        for (let index = 0; index < annotations.length; index++) {
            const annotation = annotations[index];
            if (annotation.name === "locale") {
                return true
            }
        }
        return false
    }
}

export default () => {
    return new LocaleValidationPlugin();
};
