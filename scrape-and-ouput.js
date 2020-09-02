const puppeteer = require('puppeteer-core');

let browser;
const pageToScrape = 'https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/8/82';
const data = {};
const date = getDate();
let output = '';

async function scrapePages() {
    let webpage = await loadWebpage();
    let pageData = await scrapeResults(webpage);
    console.log('results! ', pageData);
    closeBrowser();
    output = `Low tide: ${pageData['low'][0]}, ${pageData['low'][1]} \n High tide: ${pageData['high'][0]}`;
}

// SCRAPING

async function loadWebpage() {
    console.log('load webpage');
    browser = await puppeteer.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_KEY}`
    });
    console.log('connected');
    page = await browser.newPage();
    console.log('new page');
    await page.goto(pageToScrape);
    console.log('on page');
    await page.waitForSelector(".wr-c-tides-table");
    console.log('waited for selector');
    return page;
}

async function scrapeResults(page) {
    page.on('console', consoleObj => console.log(consoleObj.text()));
    const tideTimes = await page.evaluate(({
        date,
        data
    }) => {
        const container = document.querySelector(`#section-${date}`);
        const rows = Array.from(container.querySelectorAll('tbody tr'));
        rows.forEach(row => {
            let tideType = row.querySelector('.wr-c-tide-extremes__type').innerText.trim();
            tideType = tideType.includes('Next') ? tideType.split(':')[1].replace(/^\s+|\s+$/g, '') : tideType;
            tideType = tideType.toLowerCase();
            const tideTime = row.querySelector('.wr-c-tide-extremes__time').innerText.trim();
            console.log('tide type', tideType, 'tidetime', tideTime);
            data[tideType] = data[tideType] !== undefined ? [...data[tideType], tideTime] : [tideTime];
        });
        return data;
    }, {
        date,
        data
    });
    return tideTimes;
}

async function closeBrowser() {
    await browser.close();
}

// UTILS

function getDate() {
    console.log('get date');
    const today = new Date();
    let dd = today.getDate();
    dd = dd < 10 ? `0${dd}` : `${dd}`;
    let mm = today.getMonth() + 1;
    mm = mm < 10 ? `0${mm}` : `${mm}`;
    const yyyy = today.getFullYear();

    return `${yyyy}-${mm}-${dd}`;
}

const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

// START!

await scrapePages();
return output;
