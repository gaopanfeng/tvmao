const phantom = require('phantom');
const cheerio = require('cheerio');
const winston = require('winston');
const Entities = require('html-entities').XmlEntities;
const entities = new Entities();
const HEAD_URL = 'https://www.tvmao.com/program/';
const TVS = [/*'CCTV-CCTV6',*/'CHC-CHC1','CHC-CHC2','CHC-CHC3'];


const { combine, timestamp, label, printf } = winston.format;
 
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${JSON.stringify(message)}`;
});

const format1 = combine(
    label({ label: 'right meow!' }),
    timestamp(),
    myFormat
)

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


(async function() {
    

  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on('onResourceRequested', function(requestData) {
    // console.info('Requesting', requestData.url);
  });

  for(let tv of TVS){
    for(let i=1;i<=7/** 7 */;i++){
        let url = `${HEAD_URL}${tv}-w${i}.html`;
        console.log(url);
        let status = await page.open(url);
        if(status === 'success'){
            const content = await page.property('content');
            const $ = cheerio.load(content);
            let $list = $('#pgrow>li');
            let list = [];
            //console.log(list.html());
            for(let j=0;j<$list.length;j++){
                let $it = $($list[j]);
                let $a = $it.find('a');
                let href = $a.attr('href');
                let name = $a.html();
                if(href && href.startsWith('/movie/')){
                    list.push({
                        tv:tv,
                        day:i,
                        time:$it.find('span').html(),
                        name:entities.decode(name),
                        href:href
                    });
                }
            }
            list.forEach(it=>{
                logger.info(it);
            })
        }
    }
  }
  await instance.exit();
})();