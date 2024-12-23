// This plugin generate brighterscript proto from .proto files 

import {
    CompilerPlugin,
    Program,
} from 'brighterscript';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';
import md5 from 'crypto-js/md5';
import { Formatter, Runner } from 'brighterscript-formatter';
const protobufSchema = require('protocol-buffers-schema')

export class ProtoGenPlugin implements CompilerPlugin {
    public name = 'ProtoGenPlugin';

    afterProgramCreate(program: Program) {
        // @ts-ignore
        program.options.forceGenerateProtos = true;

        // Force generate flag
        // @ts-ignore
        const forceGenerateProtos = !!program.options.forceGenerateProtos;

        const rootDir = program.options.rootDir!;

        const protoFiles = globSync(`**/*.proto`, { cwd: rootDir })
            .map((protoFile) => path.join(rootDir, protoFile));

        const formatter = this.createFormatter(rootDir);

        protoFiles.forEach((protoFile) => {
            this.generateProto(program, protoFile, protoFile + '.gen.bs', formatter, forceGenerateProtos);
        });
    }

    generateProto(program: Program, protoFile: string, outputFile: string, formatter: Formatter, forceGenerateProtos: boolean) {
        program.logger.info(`Generating proto from ${protoFile}`);

        const protoContent = readFileSync(protoFile, 'binary');
        const protoHash = md5(protoContent).toString();

        if (!forceGenerateProtos && existsSync(outputFile)) {
            const firstLine = readFileSync(outputFile, 'utf8').split('\n')[1];
            const outputHash = firstLine?.split('md5:')[1]?.trim();
            if (outputHash === protoHash) {
                return;
            }
        }

        const protoSchema = protobufSchema.parse(protoContent);

        const fullNameSpace = `Protobuf.Generated.${protoSchema.package}`;

        const content = `' Auto-generated file - do not modify manually
' md5:${protoHash}
namespace Protobuf
namespace Generated
namespace ${protoSchema.package}

${this.generateCreateFunctions(protoSchema, fullNameSpace)}

${this.generateEncodeFunctions(protoSchema, fullNameSpace)}

${this.generateDecodeFunctions(protoSchema, fullNameSpace)}

end namespace
end namespace
end namespace
`;

        const formattedContent = formatter.format(content);
        writeFileSync(outputFile, formattedContent);
    }

    generateCreateFunctions(protoSchema: any, fullNameSpace: string): string {
        function generateCreateFunction(message: any): string {
            const innerTypes = message.messages.map((msg: any) => msg.name);
            const fieldsInitialization = message.fields.map((field: any) => {
                if (innerTypes.includes(field.type)) {
                    return `${field.name}: ${fullNameSpace}.create${field.type}()`;
                } else {
                    return `${field.name}: ${ProtoGenPlugin.getDefaultValue(field.type)}`;
                }
            }).join('\n');

            return `function create${message.name}() as dynamic
return {
${fieldsInitialization}
}
end function`;
        }

        const createFunctions = protoSchema.messages.map((message: any) => {
            return this.generateCreateFunctions(message, fullNameSpace);
        })

        if (protoSchema.name) {
            createFunctions.push(generateCreateFunction(protoSchema));
        }

        return createFunctions.join('\n\n');
    }

    generateEncodeFunctions(protoSchema: any, fullNameSpace: string) {
        function generateEncodeFunction(message: any): string {
            const innerTypes = message.messages.map((msg: any) => msg.name);
            const encodeFields = message.fields.map((field: any) => {
                let fieldEncode = `if message.DoesExist("${field.name}")\n`;

                if (field.repeated) {
                    fieldEncode += `for each value in message["${field.name}"]\n`;
                } else {
                    fieldEncode += `value = message["${field.name}"]\n`;
                }

                if (innerTypes.includes(field.type)) {
                    fieldEncode += `encoder.EncodeMessage(${field.tag}, ${fullNameSpace}.encode${field.type}(value))\n`;
                } else {
                    fieldEncode += `encoder.${ProtoGenPlugin.getEncoderFunction(field.type)}(${field.tag}, value)\n`;
                }

                if (field.repeated) {
                    fieldEncode += 'end for\n';
                }

                return fieldEncode + 'end if';
            }).join('\n');

            return `function encode${message.name}(message as dynamic) as string
buffer = CreateObject("roByteArray")
writer = new Protobuf.BinaryWriter()
writer.SetBuffer(buffer)
encoder = new Protobuf.Encoder(writer)
${encodeFields}
return buffer.ToBase64String().EncodeUriComponent()
end function`;
        }

        const encodeFunctions = protoSchema.messages.map((message: any) => {
            return this.generateEncodeFunctions(message, fullNameSpace);
        });

        if (protoSchema.name) {
            encodeFunctions.push(generateEncodeFunction(protoSchema));
        }

        return encodeFunctions.join('\n\n');
    }

    generateDecodeFunctions(protoSchema: any, fullNameSpace: string) {
        let decodeFunctions = protoSchema.messages.map((message: any) => {
            return `function decode${message.name}(data as dynamic) as dynamic
obj = ${fullNameSpace}.create${message.name}()
decoder = new Protobuf.Decoder(new Protobuf.BinaryReader())
decoded = decoder.DecodeMessage(data)
` + message.fields.map((field: any) => {
                return `if decoded.DoesExist("${field.tag}")
obj["${field.name}"] = decoded["${field.tag}"]
end if`;
            }).join('\n') + `
return obj
end function`;
        }).join('\n\n');
        return decodeFunctions;
    }

    static getDefaultValue(type: string): any {
        switch (type) {
            case 'string': return '""';
            case 'int32': return '0';
            case 'int64': return '0';
            case 'float': return '0.0';
            case 'double': return '0.0';
            case 'bool': return 'false';
            default: return 'invalid';
        }
    }

    static getEncoderFunction(type: string): string {
        switch (type) {
            case 'string': return 'EncodeString';
            case 'int32': return 'EncodeInt32';
            case 'int64': return 'EncodeInt64';
            case 'float': return 'EncodeFloat';
            case 'double': return 'EncodeDouble';
            case 'bool': return 'EncodeBool';
            default: return `Encode${type}`;
            // default: throw new Error(`Unknown type ${type}`);
        }
    }

    createFormatter(rootDir: string) {
        const bsfmtPath = path.join(rootDir, '../../config/bsfmt.jsonc');

        const runner = new Runner();
        const options = runner.getBsfmtOptions({
            files: [],
            bsfmtPath: bsfmtPath
        });

        return new Formatter(options);
    }
}

export default () => {
    return new ProtoGenPlugin();
};
