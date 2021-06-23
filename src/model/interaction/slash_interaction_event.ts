import { GuildMember } from 'discord.js';
import MeepBot from '../..';
import { InteractionType } from './interaction_event';
import SpecialInteractionEvent from './special_interaction_event';

export enum SlashOptionTypes {
    subcommand = 1,
    subcommandgroup = 2,
    string = 3,
    number = 4,
    boolean = 5,
    user = 6,
    channel = 7,
    role = 8,
    mentionable = 9
}

export type SlashChoice = {
    name: string;
    value: string | number;
    key?: string;
};

export type InteractionOption = {
    type: SlashOptionTypes;
    name: string;
    description?: string;
    value?: string;
    required?: boolean;
    choices?: SlashChoice[];
    options?: InteractionOption[];
};

export type SlashData = {
    name: string;
    description: string;
    options: InteractionOption[];
};

class SlashInteractionEvent extends SpecialInteractionEvent {
    readonly data: SlashData;
    readonly args: (string | GuildMember)[];
    readonly content: string;

    constructor(bot: MeepBot, data: any) {
        super(bot, data);
        if (this.type === InteractionType.slashCommand) {
            this.data = data.data;
            this.args = this.getArrayFromOptions(this.data.options);
            this.content = this.args.join(' ');
        } else {
            throw new Error('Interaction not of type slash command!');
        }
    }

    private getArrayFromOptions(options?: InteractionOption[]) {
        const args: (string | GuildMember)[] = [];

        if (!options) {
            return args;
        }

        for (const option of options) {
            if (option.options) {
                args.push(option.name);
                args.push(...this.getArrayFromOptions(option.options));
            } else {
                args.push(this.getMemberIfExists(option.value!));
            }
        }

        return args;
    }

    private getMemberIfExists(value: string | GuildMember): GuildMember | string {
        if (this.guild && value && typeof value === 'string' && value.startsWith('<@!') && value.endsWith('>')) {
            value = this.guild.members.cache.get(value.substring(3, value.length - 1)) || value;
        }

        return value;
    }
}

export default SlashInteractionEvent;
