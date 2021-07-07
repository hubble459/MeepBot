import { MessageEmbed } from 'discord.js';
import Category from '../model/category';
import { args, bad, Command, ExecData } from '../model/docorators/command';
import MessageInteractionEvent from '../model/interaction/message_interaction_event';
import Quran from '../util/api/quran';

@Command('quran', Category.miscellaneous, 0)
class QuranCommand {
    private readonly quran: Quran;

    constructor() {
        this.quran = new Quran();
    }

    @args(/\d/, 'chapter', '1-114', true)
    async exec({ interaction }: ExecData) {
        const verses = await this.quran.randomChapterVerses();
        let voiced = false;
        if (interaction instanceof MessageInteractionEvent) {
            if (interaction.member && interaction.member.voice && interaction.member.voice.channel) {
                const conn = await interaction.bot.musicPlayer.connect(interaction);
                if (conn) {
                    if (verses.length) {
                        voiced = true;
                        const embed = new MessageEmbed()
                            .setTitle('Quran')
                            .setDescription('Translation')
                            .setColor('#B00B69')
                            .addField('Verse 1', 'owo');

                        const msg = await interaction.send(embed);

                        let verseIndex = 0;
                        let verseIndexx = 0;
                        for (const verse of verses) {
                            await new Promise<void>(async (res) => {
                                embed.fields[verseIndexx].value = '';
                                embed.description = '';

                                const onClose = () => {
                                    const word = verse.words.shift();
                                    if (word) {
                                        if (word.transliteration.text) {
                                            embed.fields[verseIndexx].value += word.transliteration.text + ' ';
                                            embed.description += word.translation.text + ' ';

                                            msg.edit(embed)
                                        }
                                        conn.play(`https://verses.quran.com/${word.audio_url}`, {
                                            volume: interaction.bot.musicPlayer.getMusic(interaction)?.volume || 1
                                        })
                                            .on('close', onClose);
                                    } else {
                                        res();
                                    }
                                }

                                onClose();
                            });
                            if (embed.fields.length === 10) {
                                embed.fields.shift();
                            } else {
                                verseIndexx++;
                            }
                            embed.addField('Verse ' + (++verseIndex + 1), 'owo')
                        }
                    }
                }
            }
        }
        if (!voiced) {
            const verseWords = verses.map(verse => verse.words);
            for (let i = 0; i < verseWords.length; i += 25) {
                const words = verseWords[i];
                const embed = new MessageEmbed()
                    .setTitle('Verse ' + (Math.floor(i / 25) + 1))
                    .setDescription(words.map(word => word.transliteration.text).join(' '));
                await interaction.send(embed);
            }
        }
    }

    @bad
    async error(data: ExecData) {
        await this.exec(data);
    }
}

export default QuranCommand;
