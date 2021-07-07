import { VoiceChannel, VoiceState } from "discord.js";
import MeepBot from "..";
import MeepPlugin from "../model/plugin";
import fs from 'fs';
import path from 'path';
import MusicPlayer from "../util/music_player";

class Moan extends MeepPlugin {
    private readonly targets: Map<string, number> = new Map();
    private readonly moanSoundsDir: string;
    private readonly sounds: string[];

    constructor(bot: MeepBot) {
        super(bot);
        // bot.on('voiceStateUpdate', this.onVoiceStateUpdate.bind(this));
        this.moanSoundsDir = path.join(__dirname.slice(0, __dirname.lastIndexOf('/')), 'assets', 'sounds', 'moans');
        this.sounds = fs.readdirSync(this.moanSoundsDir);

        this.interval();
    }

    private interval() {
        setTimeout(() => {
            this.randomMoan();
            this.interval();
        }, this.randomTime());
    }

    private randomTime() {
        const int = Math.floor(Math.random() * 1.8e6) + 2000;
        console.log(`[${'MOAN'.color('fgRed')}]`, `Moaning in ${int} ms`);
        return int;
    }

    private async randomMoan() {
        const channel = this.bot.channels.cache.filter(channel => channel instanceof VoiceChannel && channel.members.size > 0).random() as VoiceChannel;
        if (channel && (!this.bot.voice || !this.bot.voice.connections.get(channel.id))) {
            if (channel.guild.voice && channel.guild.voice.connection && channel.guild.voice.connection.dispatcher) {
                console.log(`[${'MOAN'.color('fgRed')}]`, `Already doing something so not moaning`);
            } else {
                const conn = await channel.join();
                const settings = MusicPlayer.get(channel.guild.id);

                if (settings) {
                    conn.play(fs.createReadStream(path.join(this.moanSoundsDir, this.randomSoundFile())), {
                        volume: settings.volume || 1
                    })
                }
            }
        }
    }

    async test(channel: VoiceChannel) {
        const conn = await channel.join();
        const settings = MusicPlayer.get(channel.guild.id);
        if (settings) {
            return new Promise<void>((res) => {
                conn.play(fs.createReadStream(path.join(this.moanSoundsDir, this.randomSoundFile())),
                {
                    volume: settings.volume || 1
                })
                    .on('close', res);
            });
        }
    }


    private randomSoundFile() {
    return this.sounds[Math.floor(Math.random() * this.sounds.length)]
}

    // private onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    //     if (oldState.channel && !newState.channel) {
    //         const mems = (this.targets.get(oldState.channel.id) || 1) - 1;
    //         if (mems === 0) {
    //             this.targets.delete(oldState.channel.id);
    //         } else {
    //             this.targets.set(oldState.channel.id, mems);
    //         }
    //     } else if (!oldState.channel && newState.channel) {
    //         const mems = (this.targets.get(newState.channel.id) || 0) + 1;
    //         this.targets.set(newState.channel.id, mems);
    //     }
    // }
}

export default Moan;