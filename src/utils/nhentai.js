const fetch = require('node-fetch');
const {JSDOM} = require('jsdom');
const regex = /^https?:\/\/nhentai.net\/g\/\d+\/?$/;

/**
 * Return a random (english) hentai url from nhentai.net
 *
 * @param {boolean} english true if only english hentai
 * @param count
 * @returns a random nhentai url
 */
async function getRandomHentai(english = false, count = 1) {
    const response = await fetch('https://nhentai.net/random/', {method: english ? 'GET' : 'HEAD'});
    const doc = new JSDOM(await response.text()).window.document;
    let isEnglish = true;
    if (english) {
        isEnglish = !![...doc.querySelectorAll('span.name')].find(el => el.innerHTML === 'english');
        console.log(`[RND] Try #${count}`);
    }
    return isEnglish ? response.url : getRandomHentai(english, count + 1);
}

/**
 * Scrape all images from the nhentai url given
 *
 * @param {string} url
 * @returns object with hentai data including images
 */
async function getHentaiData(url) {
    if (url === 'random') {
        url = await getRandomHentai();
    }

    if (regex.test(url)) {
        const response = await fetch(url);
        const doc = new JSDOM(await response.text()).window.document;
        return {
            title: doc.title.split(' »')[0],
            images: ([...doc.querySelectorAll('div.thumbs img')]
                .map(el => el.src)
                .filter(src => !src.startsWith('data'))
                .map(src => src.replace('t.', 'i.').replace('t.', '.')))
        }
    }
    throw {message: 'Not a valid url!'};
}

module.exports = {
    getRandomHentai,
    getHentaiData,
    regex
}