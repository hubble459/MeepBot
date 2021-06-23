import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import MeepBot from '..';
import { CommandType } from '../model/docorators/command';
import { SlashData } from '../model/interaction/slash_interaction_event';

class SlashUtils {
    private readonly testServers: string[] = ['372048803827548170', '448189430331867146'];
    private readonly bot: MeepBot;
    private readonly commandDir: string;
    private readonly slashTest: boolean;

    constructor(bot: MeepBot, commandDir: string, slashTest?: boolean) {
        this.bot = bot;
        this.commandDir = commandDir;
        this.slashTest = slashTest || false;
    }

    public async loadCommands() {
        await this.loadCommandsRecursive(this.commandDir);
    }

    private async loadCommandsRecursive(dirname: string) {
        const files = fs.readdirSync(dirname);
        for (const file of files) {
            const pathname = path.join(dirname as string, file);
            const stats = fs.lstatSync(pathname);
            if (stats.isDirectory()) {
                await this.loadCommandsRecursive(pathname);
            } else if (path.extname(file).toLowerCase() === '.js') {
                try {
                    const command = new (await import(pathname)).default();
                    if (command.isCommand) {
                        this.registerSlashCommand(command);
                        this.bot.commandMap.set(command.name, command);
                    } else {
                        console.error(`Command not instance of Command ${pathname}`);
                    }
                } catch (e) {
                    console.error(`Bad file ${pathname}`, e);
                }
            }
        }
    }

    public async removeAllSlashCommands() {
        if (this.slashTest) {
            if (this.testServers) {
                for (const id of this.testServers) {
                    await this.removeSlashCommands(id);
                }
            }
        } else {
            await this.removeSlashCommands();
        }
    }

    public async registerSlashCommand(command: CommandType) {
        if (command.slash) {
            if (!command.description) {
                throw new Error(
                    `A description is required for command "${command.name}" because it is a slash command.`
                );
            }

            // TODO Check if slash options are correct
            const slashCommand: SlashData = {
                name: command.name.trim().toLowerCase().replace(/\W/g, '-'),
                description: this.bot.locales.string(command.description),
                options: command.slash
            };

            if (this.slashTest) {
                if (this.testServers) {
                    for (const id of this.testServers) {
                        await this.createSlashCommand(slashCommand, id);
                    }
                }
            } else {
                await this.createSlashCommand(slashCommand);
            }
        }
    }

    private async createSlashCommand(command: SlashData, guildId?: string) {
        // @ts-ignore
        const app = this.bot.api.applications(this.bot.user!.id);
        if (guildId) {
            app.guilds(guildId);
        }

        return app.commands.post({
            data: command
        });
    }

    private async removeSlashCommands(guildId?: string) {
        const appId = this.bot.user!.id;
        // @ts-ignore
        const app = this.bot.api.applications(appId);
        let guildPart = '';
        if (guildId) {
            app.guilds(guildId);
            guildPart = '/guilds/' + guildId;
        }

        const commands = (await app.commands.get()) as any[];
        const endpoint = `https://discord.com/api/applications/${appId}${guildPart}/commands/`;

        let succeeded = 0;
        for (const command of commands) {
            const res = await fetch(endpoint + command.id, {
                method: 'DELETE',
                headers: { Authorization: 'Bot ' + this.bot.token }
            });
            if (res.ok) {
                ++succeeded;
            }
        }
        if (succeeded === commands.length) {
            console.log('Removed all commands' + (guildId ? ' from ' + guildId : ''));
        } else {
            console.error('Failed to remove all commands' + (guildId ? ' from ' + guildId : ''));
        }
    }
}

export default SlashUtils;
