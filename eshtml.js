const fs = require('fs');
const elasticsearch = require('elasticsearch');
const nunjucks = require('nunjucks');
const client = new elasticsearch.Client({
    hosts: ['http://10.135.70.219:9200'],
    log: 'warning'
});
function num2str(num) {
    return num < 10 ? ('0' + num) : ('' + num);
}
let today = new Date();
let todayString = num2str(today.getMonth() + 1) + '-' + num2str(today.getDate());

const tpl = `
<!DOCTYPE html><html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>电视猫</title>
</head>
<body>
<table>
{% for item in aggregations.movie.buckets%}
    {%set list = item.list.hits.hits%}
    {% if list[0]._source.date <= today %}
    <tr>
    <td style="width:200px;">{{loop.index}}.<a target="_blank" href="{{list[0]._source.href}}">{{item.key}}</a></td>
    <td>
    {% for it in list%}
        <a target="_blank" href="https://www.tvmao.com/program/{{it._source.tv}}-w1.html">{{it._source.tv}}>{{it._source.date}}-{{it._source.time}}</a>&nbsp;|&nbsp;
    {% endfor%}
    </td>
    <td>{{movies.get(list[0]._source.href)}}
    </td>
    </tr>
    {% endif %}
{% endfor%}

</table>
</body>
</html>
`;


async function getMovies() {
    let ret = await client.search({
        index: 'tvmao-movie',
        type: 'movie',
        body: {
            size: 1000
        }
    });

    let movies = new Map();
    ret.hits.hits.map(it=>it._source).forEach(it=>{
        movies.set(it.href, it.content);
    });
    return movies;
}

(async ()=>{
    let movies = await getMovies();
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
                                size: 20,
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
    // console.log(JSON.stringify(ret, null, 4));
    // fs.writeFileSync('es.json', JSON.stringify(ret, null, 4));
    fs.writeFileSync('tv-es.html', nunjucks.renderString(tpl, { aggregations: ret.aggregations, movies, today: todayString }), { encoding: 'utf-8' });
    fs.writeFileSync('tv-es-all.html', nunjucks.renderString(tpl, { aggregations: ret.aggregations, movies, today: '12-31' }), { encoding: 'utf-8' });
})();

