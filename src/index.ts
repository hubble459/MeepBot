import { Client, Collection, Guild, Message, User, VoiceState } from 'discord.js';
import { CommandType } from './model/docorators/command';
import Locales from './util/locales';
import * as path from 'path';
import MessageInteractionEvent from './model/interaction/message_interaction_event';
import Enmap from 'enmap';
import './util/console';
import './util/format';
import SlashUtils from './util/slash_util';
import { InteractionType } from './model/interaction/interaction_event';
import SlashInteractionEvent from './model/interaction/slash_interaction_event';
import ButtonInteractionEvent from './model/interaction/button_interaction_event';
import MusicPlayer from './util/music_player';
import CacheEnmap from './model/cache_enmap';

console.log('Initializing MeepBot'.color('fgMagenta'));

export type Settings = {
    id: string;
    language: string;
    prefix: string;
    space: boolean;
};

type SettingsId = {
    user?: User | null;
    guild?: Guild | null;
};

class MeepBot extends Client {
    private readonly slashUtils: SlashUtils;
    public readonly commandMap: Collection<string, CommandType> = new Collection();
    public readonly locales: Locales;
    public readonly settings: Enmap;
    public readonly cache: CacheEnmap;
    public readonly cooldowns: Enmap;
    public readonly musicPlayer: MusicPlayer;

    constructor(token: string, localeDir: string, commandDir?: string, databaseDir?: string) {
        super(); // super({ intents: [Intents.NON_PRIVILEGED] } as ClientOptions);
        this.locales = new Locales(localeDir);
        this.slashUtils = new SlashUtils(this, commandDir || path.join(__dirname, 'commands'), true);
        databaseDir = databaseDir || path.join(__dirname.slice(0, __dirname.lastIndexOf(path.sep)), 'database');
        this.settings = new Enmap({
            name: 'settings',
            dataDir: databaseDir,
            autoFetch: true,
            fetchAll: false
        });
        this.cache = new CacheEnmap(databaseDir);
        this.cooldowns = new Enmap({
            name: 'cooldowns',
            dataDir: databaseDir,
            autoFetch: true,
            fetchAll: false
        });
        this.musicPlayer = new MusicPlayer(databaseDir);
        this.login(token);
        this.on('ready', this.onReady);
        this.on('message', this.onMessage);
        this.on('error', this.onError);
        this.on('guildCreate', this.onGuildCreate);
        this.on('guildDelete', this.onGuildDelete);
        this.on('voiceStateUpdate', this.onVoiceStateUpdate);
    }

    private async onReady() {
        console.log(`Logged in as ${this.user!.tag}!`);
        this.user!.setActivity("uwu's", {
            type: 'LISTENING'
        });

        await this.locales.load();
        await this.slashUtils.loadCommands();
        this.ws.on('INTERACTION_CREATE' as any, this.onInteraction.bind(this));
        // await this.slashUtils.removeAllSlashCommands();
        console.log('Commands loaded!');
    }

    private async onMessage(msg: Message) {
        const settings = this.getSettings(msg);
        const cleanContent = msg.cleanContent;

        if (
            !msg.author.bot &&
            cleanContent.length > settings.prefix.length &&
            cleanContent.startsWith(settings.prefix)
        ) {
            const command = this.parseCommand(settings, cleanContent);
            if (command) {
                const interaction = new MessageInteractionEvent(this, msg);
                console.log(interaction.tag`[${'MESSAGE'.color('fgYellow')}]`, command.name);

                try {
                    await command.execute({ interaction, messageInteraction: interaction });
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }

    public commands(guild?: Guild) {
        if (guild) {
            const id = guild.id;
        }
        return this.commandMap;
    }

    public getSettings(id: SettingsId | string): Settings {
        if (typeof id !== 'string') {
            id = id.guild ? id.guild.id : id.user ? id.user.id : 'default';
        }

        return this.settings.ensure(id, {
            id,
            nsfw: false,
            owoify: false,
            space: false,
            ridicule: 0,
            prefix: '$',
            language: 'tsundere'
        });
    }

    private parseCommand(settings: Settings, content: string): CommandType | undefined {
        const parts = content.trim().split(/ +/);
        const cName = parts[+settings.space].slice(+!settings.space).toLowerCase();
        return this.getCommand(settings, cName);
    }

    public getCommand(settings: Settings, commandName: string) {
        return this.commandMap.get(commandName) || this.commandMap.find((c) => c.aliases.includes(commandName));
    }

    private onError(error: Error) {}

    private onGuildCreate(guild: Guild) {}

    private onGuildDelete(guild: Guild) {}

    private onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
        // if (oldState.channel && !newState.channel) {
        //     if (oldState.id === client.user!.id) {
        //         const connection = this.connections[oldState.guild.id];
        //         if (connection) {
        //             connection.disconnect();
        //         }
        //         console.log('[VC] Left');
        //     }
        // } else if (!oldState.channel && newState.channel) {
        //     if (newState.id === client.user!.id) {
        //         console.log('[VC] Joined');
        //     }
        // }
    }

    private async onInteraction(data: any) {
        if (data.type === InteractionType.slashCommand) {
            const interaction = new SlashInteractionEvent(this, data);
            const commandName = interaction.data.name.toLowerCase();
            const command = this.getCommand(interaction.settings, commandName);
            if (command) {
                console.log(interaction.tag`[${'SLASH'.color('fgGreen')}]`, command.name);
                try {
                    await command.execute({ interaction, slashInteraction: interaction });
                } catch (e) {
                    console.error(e);
                }
            }
        } else if (data.type === InteractionType.button) {
            const interaction = new ButtonInteractionEvent(this, data);

            const customId = interaction.data.custom_id;
            const command = this.commandMap.find((cmd) => cmd.buttonIds.includes(customId));
            if (command) {
                try {
                    console.log(interaction.tag`[${'BUTTON'.color('fgGreen')}]`, customId);
                    await command.button(interaction);
                } catch (e) {
                    console.error(e);
                }
            }
            if (!interaction.deferred && !interaction.replied) {
                interaction.defer(true);
            }
        }
    }
}

new MeepBot(process.env.DISCORD_TOKEN!, path.join(__dirname, 'assets', 'locales'));

export default MeepBot;
