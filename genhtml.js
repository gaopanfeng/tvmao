const fs = require('fs');
const HEAD_URL = 'https://www.tvmao.com/program/';
const logs = fs.readFileSync('main.log',{encoding:'utf-8'});
let list = logs.split('\n').filter(it=>it).map(line=>JSON.parse(line));

let table = list.map(it=>`<tr><td>${it.tv}</td>
<td><a target="_blank" href="${HEAD_URL}${it.tv}-w${it.day}.html">w${it.day} ${it.time}</a></td>
<td><a target="_blank" href="https://www.tvmao.com${it.href}">${it.name}</a></td>
</tr>`).join('');

let html = `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>电视猫</title>
</head>
<body>
<table>
${table}
</table>
</body>
</html>
`
fs.writeFileSync('tv1.html',html,{encoding:'utf-8'});

