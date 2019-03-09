const fs = require('fs');
const elasticsearch = require('elasticsearch');
const nunjucks = require('nunjucks');
const axios = require('axios');
const cheerio = require('cheerio');
const client = new elasticsearch.Client({
    hosts: ['http://10.135.70.219:9200'],
    log: 'warning'
});

async function getMovies(){
    let ret = await client.search({
        index: 'tvmao-movie',
        type: 'movie',
        body: {
            size: 1000
        }
    });

    let movies = new Map();
    ret.hits.hits.map(it=>it._source).forEach(it=>{
        movies.set(it.href,it.content);
    })
    return movies;
}

(async ()=>{
    let movieMap = await getMovies();
    let ret = await client.search({
        index: 'tvmao_*',
        type: 'tvmao',
        body: {
            size: 1,
            aggs: {
                movie: {
                    terms: {
                        field: 'name.keyword',
                        size: 1000
                    },
                    aggs: {
                        list: {
                            top_hits: {
                                size: 1,
                                sort: [
                                    {
                                        'date.keyword': {
                                            order: 'asc'
                                        }
                                    },
                                    {
                                        'time.keyword': {
                                            order: 'asc'
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }
    });

    // let movies_ret = await client.search({
    //     index: 'tvmao-movie',
    //     type: 'movie',
    //     body: {
    //         size: 1000
    //     }
    // });

    //let movies = movies_ret.hits.hits.map(it=>it._source);

    // console.log(JSON.stringify(ret,null,4));

    let movies = ret.aggregations.movie.buckets.map(it=>it.list.hits.hits[0]._source);
    movies = movies.filter(it=>!movieMap.has(it.href));
    for(let movie of movies){
        let href = movie.href;
        let name = movie.name;
        let id = href.substring(href.lastIndexOf('/')+1);
        let movieret = await axios.get(href.replace('https://','http://'));
        console.log(href,movieret.status);
        if(movieret.status === 200){
            let content = movieret.data;
            const $ = cheerio.load(content);
            const text = $('.obj_meta').text();
            await client.index({
                index:'tvmao-movie',
                type:'movie',
                id:id,
                body:{
                    name:name,
                    href:href,
                    content:text
                }
            });
        }
    }    
})();

