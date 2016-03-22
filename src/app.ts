/// <reference path="../typings/browser.d.ts" />

// var config:any = require('config');
import express = require('express');
import http = require('http');

var app = express();
app.set('port', (process.env.PORT || 4000));

// When running on devboxes, override the default config loading
// app.use('/config/default.json', (req, res) => {
//     res.send(JSON.parse(JSON.stringify(config)));
// });

app.use('/', express.static('app'));

var server = http.createServer(app);

server.listen(app.get('port'), () => {
    console.info('Express server listening', {port: app.get('port')});
});
