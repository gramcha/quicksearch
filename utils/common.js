/**
 * Created by gramcha on 15/09/17.
 */
var fs = require('fs');
var path = require('path');

function lsSync(currentDirPath, filelist) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            // callback(filePath, stat);
            filelist.push(filePath);
        } else if (stat.isDirectory()) {
            lsSync(filePath, filelist);
        }
    });
}

function getFileList(dirPath) {
    let fileList = [];
    lsSync(dirPath, fileList);
    // console.log(fileList);
    return fileList;
}

let utils = {getFileList};
module.exports = utils;