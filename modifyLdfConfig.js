#!/usr/bin/node


var fs = require('fs');




var config = fs.readFileSync('ll.config.json', 'UTF-8');
var jsonConfig = JSON.parse(config);
console.log(jsonConfig.title);

for (var md5 in jsonConfig.datasources) {
    //jsonConfig.datasources[md5].settings.external = true;
    if (jsonConfig.datasources[md5].settings.file.indexOf('clean.hdt') === -1) jsonConfig.datasources[md5].settings.file += '/clean.hdt';
}
fs.writeFileSync('ll.config.json.test', JSON.stringify(jsonConfig, null, '\t' ));
