const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const getUa = require('./getUa');



(async function () {
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    page.setUserAgent(getUa());
    let result = await page.goto('https://www.tvmao.com/program/CCTV-CCTV6-w1.html');
    console.log(result.status());
    // await (await page.$('.more-epg')).click();
    const pgrowHandle = await page.$eval('#pgrow', node=>node.innerHTML);
    // // const listHandle = await page.$eval('document.getElementById("pgrow").innerHTML');
    console.log(pgrowHandle);
    await browser.close();
}());