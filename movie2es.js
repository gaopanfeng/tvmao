const fs = require('fs');
const elasticsearch = require('elasticsearch');
const nunjucks = require('nunjucks');
const client = new elasticsearch.Client({
    hosts: ['http://10.135.70.219:9200'],
    log: 'warning'
});

(async ()=>{
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

    
})();

