const cheerio = require('cheerio');
const winston = require('winston');
const puppeteer = require('puppeteer');
const elasticsearch = require('elasticsearch');
const getUa = require('./getUa');
const client = new elasticsearch.Client({
    hosts: ['http://es01.nodemonitor.hb.ted:9200'],
    log: 'debug'
});
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();
const HEAD_URL = 'https://www.tvmao.com/program/';
const TVS = ['CCTV-CCTV6', 'CHC-CHC1', 'CHC-CHC2', 'CHC-CHC3'];

const { combine, timestamp, label, printf } = winston.format;

const myFormat = printf(({ message }) => {
    return `${JSON.stringify(message)}`;
});

const format1 = combine(label({ label: 'right meow!' }), timestamp(), myFormat);

const logger = winston.createLogger({
    level: 'info',
    format: format1,
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'main.log' }),
        new winston.transports.Console({
            format: format1
        })
    ]
});

function sleep(sec = 1) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log('sleep ' + sec + 's');
            resolve();
        }, sec * 1000);
    });
}

(async function () {
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    //page.on('onResourceRequested', function(requestData) {
    // console.info('Requesting', requestData.url);
    //});
    for (let tv of TVS.slice(0)) {
        for (let i = 1; i <= 14 /** 7 */; i++) {
            await sleep(1);
            let url = `${HEAD_URL}${tv}-w${i}.html`;
            console.log(url);
            page.setUserAgent(getUa());
            let response = await page.goto(url);
            if (response.status() === 200) {
                await (await page.$('.more-epg')).click();
                const content = await page.content();
                const $ = cheerio.load(content);
                let day = $('.weekcur span').html();
                let $list = $('#pgrow li');
                let list = [];
                // console.log(list.html());
                for (let j = 0; j < $list.length; j++) {
                    let $it = $($list[j]);
                    let $a = $it.find('a');
                    let href = $a.attr('href');
                    let name = $a.html();
                    if (href && href.startsWith('/movie/')) {
                        list.push({
                            tv: tv,
                            date: day,
                            day: i,
                            time: $it.find('span').html(),
                            name: entities.decode(name),
                            href: 'https://www.tvmao.com' + href
                        });
                    }
                }
                list.forEach(it => {
                    logger.info(it);
                });

                for (let item of list) {
                    await client.index({
                        index: `tvmao_${item.date}`,
                        type: 'tvmao',
                        id: `${item.tv}-${item.date}-${item.time}`,
                        body: item
                    });
                }
            }
        }
    }
    await browser.close();
})();
