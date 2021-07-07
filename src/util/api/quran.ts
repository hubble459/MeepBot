import got from 'got';

export interface QuranVerse {
    id: number;
    verse_numnber: null | number;
    verse_key: null | string;
    juz_number: null | number;
    hizb_number: null | number;
    rub_number: null | number;
    sajdah_type: null | string;
    sajdah_number: null | number;
    words: {
        id: number;
        position: number;
        audio_url: string;
        char_type_name: string;
        line_number: number;
        code_v1: string;
        translation: {
            text: string;
            language_name: string;
        },
        transliteration: {
            text: string;
            language_name: string;
        }
    }[];
}

interface QuranPagination {
    per_page: number;
    current_page: number;
    next_page: null | string;
    total_pages: number;
    total_records: number;
}

interface QuranResponse {
    verses: QuranVerse[];
    pagination: QuranPagination;
}

class Quran {
    async randomChapterVerses() {
        const randChap = Math.floor(Math.random() * 114) + 1;

        let json = <QuranResponse>await got(`https://api.quran.com/api/v4/verses/by_chapter/${randChap}?language=en&words=true&page=1&per_page=50`).json();
        const verses = json.verses;
        while (json.pagination.next_page) {
            json = <QuranResponse>await got(`https://api.quran.com/api/v4/verses/by_chapter/${randChap}?language=en&words=true&page=${json.pagination.next_page}&per_page=50`).json();
            verses.push(...json.verses);
        }
        return verses;
    }
}

export default Quran;

new Quran().randomChapterVerses();
