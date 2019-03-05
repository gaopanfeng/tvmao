const fs = require('fs');
const elasticsearch = require('elasticsearch');
const nunjucks = require('nunjucks');
const client = new elasticsearch.Client({
    hosts: ['http://10.135.70.219:9200'],
    log: 'warning'
});

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
    <tr>
    <td><a target="_blank" href="{{list[0]._source.href}}">{{item.key}}</a></td>
    <td>
    {% for it in list%}
        <a target="_blank" href="https://www.tvmao.com/program/{{it._source.tv}}-w1.html">{{it._source.tv}}>{{it._source.date}}-{{it._source.time}}</a>&nbsp;|&nbsp;
    {% endfor%}
    </td>
    </tr>
{% endfor%}

</table>
</body>
</html>
`;

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
                                size: 10,
                                sort: [
                                    {
                                        'date.keyword': {
                                            order: 'desc'
                                        }
                                    },
                                    {
                                        'time.keyword': {
                                            order: 'desc'
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
    console.log(JSON.stringify(ret, null, 4));
    fs.writeFileSync('tv-es.html', nunjucks.renderString(tpl, ret), { encoding: 'utf-8' });
})();

