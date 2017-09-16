/**
 * Created by gramcha on 16/09/17.
 */
let  express = require('express'),
    app = express(),
    port = process.env.PORT || 5000;
let bodyParser = require('body-parser');
let router = require('./routes');
let parser = require('./parser');
let utils = require('./utils/common');

app.listen(port);
parser.createIndex(utils.getFileList('./../redis/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/quicksearch',router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let  err = new Error('Not Found');
    err.status = 404;
    next(err);
});

console.log('quicksearch server started on: ' + port);