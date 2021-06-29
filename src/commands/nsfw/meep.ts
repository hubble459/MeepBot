import { Message, MessageEmbed } from 'discord.js';
import { Hentai, NHentai, NHentaiSort, NHLanguage, SearchResults, Tag } from 'nhentai.js-api';
import MessageButton from '../../model/button/message_button';
import Category from '../../model/category';
import { args, bad, button, choice, Command, ExecData, option, sub } from '../../model/docorators/command';
import ButtonInteractionEvent from '../../model/interaction/button_interaction_event';
import MessageInteractionEvent from '../../model/interaction/message_interaction_event';
import SlashInteractionEvent, { SlashOptionTypes } from '../../model/interaction/slash_interaction_event';
import { isTrue } from '../../util/util';

type ImagePagination = {
    title: string;
    url: string;
    images: string[];
    image: number;
};

const MEEP_READ = 'meep_read';
const MEEP_READ_NEXT = 'meep_read_next';
const MEEP_READ_PREVIOUS = 'meep_read_previous';
const MEEP_SEARCH_PREVIOUS = 'meep_search_previous';
const MEEP_SEARCH_NEXT = 'meep_search_next';

@Command('meep', Category.nsfw, 0, 'hentai')
class Meep {
    readonly nhentai: NHentai;

    constructor() {
        this.nhentai = new NHentai();
    }

    @sub('search', 'search for hentai')
    @option('search', 'query', 'search query', true)
    @option('search', 'sort', 'sort results', false)
    @choice('sort', 'recent')
    @choice('sort', 'today')
    @choice('sort', 'this-week')
    @choice('sort', 'all-time')
    async search({ interaction, slashInteraction: slashInteracton }: ExecData) {
        let query = interaction.args as string[];

        let sort = NHentaiSort.recent;
        if (slashInteracton) {
            sort = this.stringToSort(query[1] as any);
            query = [query[0]];
        } else {
            const sortFlag = query.indexOf('--sort');
            if (sortFlag !== -1) {
                sort = this.stringToSort(query[sortFlag + 1] as any);
                query.splice(sortFlag, 2);
            }
        }

        const searchQuery = query.join(' ');
        const results = await this.nhentai.search(searchQuery, sort);
        const embed = this.searchResultsToEmbed(results);

        if (results.pages > 1) {
            const prev = MessageButton.previous(MEEP_SEARCH_PREVIOUS, true);
            const next = MessageButton.next(MEEP_SEARCH_NEXT);

            let msg: Message;
            if (interaction instanceof MessageInteractionEvent) {
                msg = await interaction.send(embed, prev, next);
            } else {
                msg = await interaction.send(embed, false, prev, next);
            }
            interaction.bot.cache.set(msg.id, results);
        } else {
            await interaction.send(embed);
        }
    }

    @sub('read', 'read a hentai')
    @option('read', 'numbers', 'url or numbers', true)
    async read({ interaction }: ExecData) {
        const { args } = interaction;
        if (args.length === 1) {
            const urlOrNumbers = args[0] as string;
            const isNumber = /^\d+$/.test(urlOrNumbers);
            if (isNumber || NHentai.nhentaiRegex.test(urlOrNumbers)) {
                const hentai = await this.nhentai.hentai(isNumber ? +urlOrNumbers : urlOrNumbers);
                await this.hentaiHomePage(interaction, hentai);
                return;
            }
        }

        interaction.send('not a number or a valid url');
    }

    @sub('random', 'random hentai')
    @option('random', 'english', 'get a random english hentai', false, SlashOptionTypes.boolean)
    async random({ interaction }: ExecData) {
        const english = (<string>interaction.args[0] || 'true').toLowerCase();
        const hentai = await this.nhentai.random(isTrue(english) || english === 'english');
        await this.hentaiHomePage(interaction, hentai);
    }

    @args(/(true|english)?/)
    async randomEmpty({ interaction }: ExecData) {
        const english = (<string>interaction.args[0] || 'true').toLowerCase();
        const hentai = await this.nhentai.random(isTrue(english) || english === 'english');
        await this.hentaiHomePage(interaction, hentai);
    }

    private async hentaiHomePage(interaction: SlashInteractionEvent | MessageInteractionEvent, hentai: Hentai) {
        const embed = new MessageEmbed()
            .setTitle(hentai.cleanTitle)
            .setURL(hentai.url)
            .setThumbnail(hentai.cover)
            .setColor('#b00b69');
        for (const tagGroup in hentai.tags) {
            if (Object.prototype.hasOwnProperty.call(hentai.tags, tagGroup)) {
                const tags = <Tag[]>hentai.tags[<never>tagGroup];
                if (tags.length) {
                    embed.addField(tagGroup, this.tagArrayToCodeParts(tags))
                }
            }
        }
        // if (hentai.tags.parodies.length) embed.addField('parodies', this.stringArrayToCodeParts(hentai.parodies, 'parody'));
        // if (hentai.tags.characters.length)
        //     embed.addField('characters', this.stringArrayToCodeParts(hentai.characters, 'character'));
        // if (hentai.tags.tags.length) embed.addField('tags', this.stringArrayToCodeParts(hentai.tags, 'tag'));
        // if (hentai.tags.artists.length) embed.addField('artists', this.stringArrayToCodeParts(hentai.artists, 'artist'));
        // if (hentai.tags.groups.length) embed.addField('groups', this.stringArrayToCodeParts(hentai.groups, 'group'));
        // if (hentai.tags.languages.length)
        //     embed.addField('languages', this.stringArrayToCodeParts(hentai.languages, 'language'));
        // if (hentai.tags.categories.length)
        //     embed.addField('categories', this.stringArrayToCodeParts(hentai.categories, 'category'));

        const read = new MessageButton().setLabel('read').setCustomId(MEEP_READ);

        let msg: Message;
        if (interaction instanceof MessageInteractionEvent) {
            msg = await interaction.send(embed, read);
        } else {
            msg = await interaction.send(embed, false, read);
        }
        interaction.bot.cache.set(msg.id, hentai);
    }

    @button(MEEP_READ)
    async readRandom(interaction: ButtonInteractionEvent) {
        const hentai = <Hentai>interaction.bot.cache.get(interaction.message.id);
        if (hentai) {
            await this.meepRead(interaction, {
                title: hentai.title,
                url: hentai.url,
                images: hentai.images,
                image: 0
            });
        }
    }

    @button(MEEP_READ_NEXT)
    async readNext(interaction: ButtonInteractionEvent) {
        const imagePagination = <ImagePagination>interaction.bot.cache.get(interaction.message.id);
        if (imagePagination) {
            ++imagePagination.image;
            await this.meepRead(interaction, imagePagination);
        }
    }

    @button(MEEP_READ_PREVIOUS)
    async readPrevious(interaction: ButtonInteractionEvent) {
        const imagePagination = <ImagePagination>interaction.bot.cache.get(interaction.message.id);
        if (imagePagination) {
            --imagePagination.image;
            await this.meepRead(interaction, imagePagination);
        }
    }

    @button(MEEP_SEARCH_NEXT)
    async searchNext(interaction: ButtonInteractionEvent) {
        const results = <SearchResults>interaction.bot.cache.get(interaction.message.id);

        if (results) {
            await results.next();
            await this.meepSearch(interaction, results);
        }
    }

    @button(MEEP_SEARCH_PREVIOUS)
    async searchPrevious(interaction: ButtonInteractionEvent) {
        const results = <SearchResults>interaction.bot.cache.get(interaction.message.id);
        console.log(results);

        if (results) {
            await results.previous();
            await this.meepSearch(interaction, results);
        }
    }

    @bad
    async bad({ interaction }: ExecData) {
        interaction.send('bRo..');
    }

    private ellipsis(text: string, length: number = 40) {
        text = text.slice(0, length);
        return text + (text.length > length ? '...' : '');
    }

    private stringToSort(sort: 'today' | 'recent' | 'week' | 'all_time'): NHentaiSort {
        return NHentaiSort[sort] || NHentaiSort.recent;
    }

    private languageToEmoji(language: NHLanguage) {
        switch (language) {
            case 'chinese':
                return '🇨🇳';
            case 'english':
                return '🇺🇸';
            default:
                return '🇯🇵';
        }
    }

    private tagArrayToCodeParts(arr: Tag[]) {
        const blocks = arr.map((t) =>
            `[\`${t.name.replace('|', '-')}\`](${t.url})\`${t.amountString}\``
        );

        const size = blocks.reduce((size, tag) => size += tag.length, 0);
        if (size > 1024) {
            for (let i = blocks.length - 1; i >= 0; i--) {
                blocks[i] = '`' + arr[i].name + '``' + arr[i].amountString+ '`';
                if (blocks.reduce((size, tag) => size += tag.length, 0) <= 1024) {
                    break;
                }
            }
        }

        return blocks.join(' ');
    }

    private imageEmbed(imagePagination: ImagePagination) {
        return new MessageEmbed()
            .setTitle(imagePagination.title)
            .setURL(imagePagination.url)
            .setImage(imagePagination.images[imagePagination.image])
            .setColor('#b00b69')
            .setFooter(`image ${imagePagination.image + 1} of ${imagePagination.images.length}`);
    }

    private searchResultsToEmbed(results: SearchResults) {
        const embed = new MessageEmbed()
            .setTitle(`Search \`${results.search}\``)
            .setColor('#b00b69')
            .setFooter(
                `${results.sort} | ${results.total} result${results.total === 1 ? '' : 's'}${results.total > 0 ? ` | page: ${results.page} of ${results.pages}` : ''
                }`
            );

        if (results.total > 0) {
            let list = results.hentai
                .map(
                    (hentai) =>
                        `[\`${hentai.id}\`](https://nhentai.net/g/${hentai.id}): ${this.languageToEmoji(
                            hentai.language
                        )} ${this.ellipsis(hentai.cleanTitle)}`
                )
                .join('\n');

            while (list.length > 2048) {
                list = list.slice(0, list.lastIndexOf('\n'));
            }
            embed.setDescription(list);
        }
        return embed;
    }

    async meepRead(interaction: ButtonInteractionEvent, imagePagination: ImagePagination) {
        const prev = MessageButton.previous(MEEP_READ_PREVIOUS, imagePagination.image === 0);
        const next = MessageButton.next(MEEP_READ_NEXT, imagePagination.image === imagePagination.images.length - 1);
        await interaction.edit(this.imageEmbed(imagePagination), false, prev, next);
        interaction.bot.cache.set(interaction.message.id, imagePagination);
    }

    async meepSearch(interaction: ButtonInteractionEvent, results: SearchResults) {
        const prev = MessageButton.previous(MEEP_SEARCH_PREVIOUS, results.page === 1);
        const next = MessageButton.next(MEEP_SEARCH_NEXT, results.page === results.pages);
        await interaction.edit(this.searchResultsToEmbed(results), false, prev, next);
        interaction.bot.cache.set(interaction.message.id, results);
    }
}

export default Meep;
