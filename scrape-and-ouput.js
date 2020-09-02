const puppeteer = require('puppeteer');

let browser;
const pageToScrape = 'https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/8/82';
const data = {};
const date = getDate();

async function runTheScripts() {
    await scrapePages();
    // await slackAlert();
}

async function scrapePages() {
    let webpage = await loadWebpage();
    let pageData = await scrapeResults(webpage);
    console.log('results! ', pageData);
    closeBrowser();
}

// SCRAPING

async function loadWebpage() {
    browser = await puppeteer.launch({
        headless: true
    });
    page = await browser.newPage();
    await page.goto(pageToScrape);
    await page.waitForSelector(".wr-c-tides-table");
    return page;
}

async function scrapeResults(page) {
    page.on('console', consoleObj => console.log(consoleObj.text()));
    const tideTimes = await page.evaluate(({ date, data }) => {
        const container = document.querySelector(`#section-${date}`);
        const rows = Array.from(container.querySelectorAll('tbody tr'));
        rows.forEach(row => {
            let tideType = row.querySelector('.wr-c-tide-extremes__type').innerText.trim();
            tideType = tideType.includes('Next') ? tideType.split(':')[1].replace(/^\s+|\s+$/g, '') : tideType;
            const tideTime = row.querySelector('.wr-c-tide-extremes__time').innerText.trim();
            console.log('tide type', tideType, 'tidetime', tideTime);
            data[tideType] = data[tideType] !== undefined ? [...data[tideType], tideTime] : [tideTime];
        });
        return data;
    }, { date, data });
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

runTheScripts();
