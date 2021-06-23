import 'reflect-metadata';
import Category from '../category';
import InteractionEvent from '../interaction/interaction_event';
import SlashInteractionEvent, {
    InteractionOption,
    SlashChoice,
    SlashOptionTypes
} from '../interaction/slash_interaction_event';
import MessageInteractionEvent from '../interaction/message_interaction_event';
import ButtonInteractionEvent from '../interaction/button_interaction_event';
import { MessageEmbed } from 'discord.js';

const argsKey = Symbol('args');
const messageKey = Symbol('message');
const choiceKey = Symbol('choice');
const optionKey = Symbol('option');
const subKey = Symbol('sub');
const buttonKey = Symbol('button');
const badKey = Symbol('bad');
const cooldownKey = Symbol('cooldown');

type ArgMeta = {
    propertyKey: string;
    args: string[] | RegExp;
    option?: InteractionOption;
    slash?: boolean;
};

type MessageMeta = {
    propertyKey: string;
};

type SubMeta = {
    propertyKey: string;
    name: string;
    description: string;
};

type ChoiceMeta = {
    propertyKey: string;
    argName: string;
    choice: SlashChoice;
};

type OptionMeta = {
    propertyKey: string;
    subName: string;
    option: InteractionOption;
};

type ButtonMeta = {
    propertyKey: string;
    buttonId: string;
};

type Constructor = new (...args: any[]) => {};

export type CommandType = {
    readonly name: string;
    readonly category: Category;
    readonly description: string;
    readonly help: string;
    readonly permissions: number;
    readonly cooldown: number;
    readonly aliases: string[];
    readonly buttonIds: string[];
    readonly slash?: InteractionOption[];
    readonly execute: (data: ExecData) => Promise<void>;
    readonly button: (event: InteractionEvent) => Promise<void>;
};

export type ExecData = {
    interaction: MessageInteractionEvent | SlashInteractionEvent;
    messageInteraction?: MessageInteractionEvent;
    slashInteraction?: SlashInteractionEvent;
};

export function Command(name: string, category: Category, cooldown?: number, ...aliases: string[]) {
    return <T extends Constructor>(constructor: T) => {
        const message: MessageMeta[] = Reflect.getMetadata(messageKey, constructor.prototype) || [];
        const bad: MessageMeta[] = Reflect.getMetadata(badKey, constructor.prototype) || [];
        const args: ArgMeta[] = Reflect.getMetadata(argsKey, constructor.prototype) || [];
        const choices: ChoiceMeta[] = Reflect.getMetadata(choiceKey, constructor.prototype) || [];
        const options: OptionMeta[] = Reflect.getMetadata(optionKey, constructor.prototype) || [];
        const buttons: ButtonMeta[] = Reflect.getMetadata(buttonKey, constructor.prototype) || [];
        const subCommands: SubMeta[] = Reflect.getMetadata(subKey, constructor.prototype) || [];
        const cooldownFunctions: MessageMeta[] = Reflect.getMetadata(cooldownKey, constructor.prototype) || [];

        const filteredArgs = args.filter((a) => !!a.option);
        let slashOptions: InteractionOption[] | undefined;
        const slashArg = args.find((a) => a.slash);
        if (slashArg) {
            slashOptions = [];
        }
        if (subCommands.length || filteredArgs.length) {
            slashOptions = [];
            for (const meta of subCommands) {
                slashOptions.push({
                    type: SlashOptionTypes.subcommand,
                    name: meta.name,
                    description: meta.description,
                    options: options
                        .filter((oMeta) => oMeta.subName === meta.name)
                        .map((option) => {
                            option.option.choices = choices
                                .filter((cMeta) => option.option.name === cMeta.argName)
                                .map((cMeta) => cMeta.choice);
                            return option.option;
                        })
                        .sort((o1, o2) => +(o2.required || 0) - +(o1.required || 0))
                });
            }
            for (const meta of filteredArgs) {
                const option = meta.option;
                if (option) {
                    const newOption: InteractionOption = {
                        ...option,
                        choices: choices.filter((cMeta) => option.name === cMeta.argName).map((cMeta) => cMeta.choice)
                    };

                    if (newOption.type === SlashOptionTypes.boolean && newOption.choices!.length) {
                        throw new Error(`@arg('${Option.name}') is of type boolean, so it should not have choices`);
                    }

                    slashOptions.push(newOption);
                }
            }
        }

        return class Command extends constructor {
            readonly name: string = name;
            readonly category: Category = category;
            readonly help: string = name + '_help';
            readonly description: string = name + '_description';
            readonly aliases: string[] = aliases;
            readonly buttonIds: string[] = buttons.map((b) => b.buttonId);
            readonly cooldown: number = cooldown || 0;
            readonly slash?: InteractionOption[] = slashOptions;
            readonly isCommand: boolean = true;
            async execute(data: ExecData) {
                const last = data.interaction.bot.cooldowns.get(data.interaction.user.id);
                const now = Date.now();
                const diff = now - last;
                if (diff < this.cooldown) {
                    for (const fun of cooldownFunctions) {
                        // @ts-ignore
                        return this[fun.propertyKey](data);
                    }
                    const embed = new MessageEmbed()
                        .setTitle('cooldown')
                        .setColor('RED')
                        .setDescription(`wait ${((this.cooldown - diff) / 1000).toFixed()} seconds`);
                    data.interaction.send(embed);
                    return;
                } else {
                    data.interaction.bot.cooldowns.set(data.interaction.user.id, now);
                }

                for (const meta of message) {
                    // @ts-ignore
                    return this[meta.propertyKey](data);
                }

                if (data.slashInteraction) {
                    // @ts-ignore
                    const options = data.interaction.data.options || [];
                    for (const option of options) {
                        if (option.type === SlashOptionTypes.subcommand) {
                            const meta = subCommands.find((meta) => meta.name === option.name);
                            if (meta) {
                                data.interaction.args.shift();
                                // @ts-ignore
                                return this[meta.propertyKey](data);
                            }
                        }

                        const meta = choices.find((meta) => meta.argName === option.name);
                        if (meta) {
                            // @ts-ignore
                            return this[meta.propertyKey](data);
                        }
                    }
                }

                const firstArg = data.interaction.args[0];
                if (firstArg) {
                    const subCommand = subCommands.find((meta) => meta.name === firstArg);
                    if (subCommand) {
                        data.interaction.args.shift();
                        // @ts-ignore
                        return this[subCommand.propertyKey](data);
                    }
                }

                for (const meta of args) {
                    if (argsEquals(meta.args, data.interaction.args as string[])) {
                        // @ts-ignore
                        return this[meta.propertyKey](data);
                    }
                }

                if (data.slashInteraction) {
                    if (slashArg && argsEquals(slashArg.args, data.interaction.args as string[])) {
                        // @ts-ignore
                        return this[slashArg.propertyKey](data);
                    }
                }

                for (const meta of bad) {
                    // @ts-ignore
                    return this[meta.propertyKey](data);
                }
            }
            async button(e: ButtonInteractionEvent) {
                for (const meta of buttons) {
                    if (meta.buttonId === e.data.custom_id) {
                        // @ts-ignore
                        return this[meta.propertyKey](e);
                    }
                }
            }
        };
    };
}

function argsEquals(expected: string[] | RegExp, actual: string[]): boolean {
    if (expected instanceof RegExp) {
        return expected.test(actual.join(' '));
    } else if (expected.length === actual.length || (expected.includes('**') && actual.length >= expected.length)) {
        if (!expected.length && !actual.length) {
            return true;
        }

        let exString = expected.join(' ');
        if (expected[0] === '**') {
            if (expected.length === 1) {
                return true;
            } else {
                exString = exString.replace(/\*\* /, '\\w+.*');
            }
        } else if (expected[0] === '*') {
            return actual.length === 1;
        }

        const ac = actual.join(' ');
        const ex = new RegExp('^' + exString.replace(/ ?\*\* /g, '( | .* )').replace(' *', '[^ ]+') + '$');
        console.log('[COMMAND]'.color('fgGreen'), ac, ex);

        return ex.test(ac);
    } else {
        return false;
    }
}

export function args(
    args?: string[] | RegExp | boolean,
    name?: string,
    description?: string,
    required?: boolean,
    type: SlashOptionTypes = SlashOptionTypes.string
) {
    return (
        target: any,
        propertyKey: string,
        _description: TypedPropertyDescriptor<(data: ExecData) => Promise<void>>
    ) => {
        let arr: ArgMeta[] = Reflect.getMetadata(argsKey, target);
        if (!arr) Reflect.defineMetadata(argsKey, (arr = []), target);
        if (typeof args === 'boolean') {
            if (args) {
                arr.push({ propertyKey, args: [], slash: true });
            }
            args = [];
        }
        const option: InteractionOption | undefined = name
            ? {
                  type: type || SlashOptionTypes.string,
                  name,
                  description,
                  required: required || false
              }
            : undefined;
        arr.push({ propertyKey, args: args || [], option });
    };
}

export function sub(name: string, description: string) {
    return (
        target: any,
        propertyKey: string,
        _description: TypedPropertyDescriptor<(data: ExecData) => Promise<void>>
    ) => {
        let arr: SubMeta[] = Reflect.getMetadata(subKey, target);
        if (!arr) Reflect.defineMetadata(subKey, (arr = []), target);

        arr.push({ propertyKey, name, description });
    };
}

export function option(
    subName: string,
    name: string,
    description: string,
    required?: boolean,
    type?: SlashOptionTypes
) {
    return (
        target: any,
        propertyKey: string,
        _description: TypedPropertyDescriptor<(data: ExecData) => Promise<void>>
    ) => {
        let arr: OptionMeta[] = Reflect.getMetadata(optionKey, target);
        if (!arr) Reflect.defineMetadata(optionKey, (arr = []), target);

        arr.push({
            propertyKey,
            subName,
            option: { name, description, required: required || false, type: type || SlashOptionTypes.string }
        });
    };
}

export function choice(argName: string, choiceName: string) {
    return (
        target: any,
        propertyKey: string,
        _description: TypedPropertyDescriptor<(data: ExecData) => Promise<void>>
    ) => {
        let arr: ChoiceMeta[] = Reflect.getMetadata(choiceKey, target);
        if (!arr) Reflect.defineMetadata(choiceKey, (arr = []), target);

        arr.push({ propertyKey, argName, choice: { name: choiceName, value: choiceName } });
    };
}

export function message(
    target: any,
    propertyKey: string,
    _description: TypedPropertyDescriptor<(data: ExecData) => Promise<void>>
) {
    let arr: MessageMeta[] = Reflect.getMetadata(messageKey, target);
    if (!arr) Reflect.defineMetadata(messageKey, (arr = []), target);

    arr.push({ propertyKey });
}

export function cooldown(
    target: any,
    propertyKey: string,
    _description: TypedPropertyDescriptor<(data: ExecData) => Promise<void>>
) {
    let arr: MessageMeta[] = Reflect.getMetadata(cooldownKey, target);
    if (!arr) Reflect.defineMetadata(cooldownKey, (arr = []), target);

    arr.push({ propertyKey });
}

export function bad(
    target: any,
    propertyKey: string,
    _description: TypedPropertyDescriptor<(data: ExecData) => Promise<void>>
) {
    let arr: MessageMeta[] = Reflect.getMetadata(badKey, target);
    if (!arr) Reflect.defineMetadata(badKey, (arr = []), target);

    arr.push({ propertyKey });
}

export function button(buttonId: string) {
    return (
        target: any,
        propertyKey: string,
        _description: TypedPropertyDescriptor<(event: ButtonInteractionEvent) => Promise<void>>
    ) => {
        let arr: ButtonMeta[] = Reflect.getMetadata(buttonKey, target);
        if (!arr) Reflect.defineMetadata(buttonKey, (arr = []), target);

        arr.push({ propertyKey, buttonId });
    };
}
