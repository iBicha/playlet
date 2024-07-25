// This plugin overrides Roku data types used by validation and completion features

import {
    BeforeProgramCreateEvent,
    CompilerPlugin,
} from 'brighterscript';

import { components } from 'brighterscript/dist/roku-types/index';

export class RokuTypesPlugin implements CompilerPlugin {
    public name = 'RokuTypesPlugin';

    beforeProgramCreate(event: BeforeProgramCreateEvent) {
        if (components.roappmemorymonitor.interfaces.find(i => i.name === 'ifSetMessagePort')) {
            event.builder.logger.error('ifSetMessagePort already exists on roAppMemoryMonitor');
        } else {
            components.roappmemorymonitor.interfaces.push({
                "name": "ifSetMessagePort",
                "url": "https://developer.roku.com/docs/references/brightscript/interfaces/ifsetmessageport.md"
            });
        }

        if (components.rosystemlog.interfaces.find(i => i.name === 'ifSetMessagePort')) {
            event.builder.logger.error('ifSetMessagePort already exists on roSystemLog');
        } else {
            components.rosystemlog.interfaces.push({
                "name": "ifSetMessagePort",
                "url": "https://developer.roku.com/docs/references/brightscript/interfaces/ifsetmessageport.md"
            });
        }

        if (components.rostreamsocket.interfaces.find(i => i.name === 'ifSocketOption')) {
            event.builder.logger.error('ifSocketOption already exists on roStreamSocket');
        } else {
            components.rostreamsocket.interfaces.push({
                "name": "ifSocketOption",
                "url": "https://developer.roku.com/docs/references/brightscript/interfaces/ifsocketoption.md"
            });
        }
    }
}

export default () => {
    return new RokuTypesPlugin();
};
