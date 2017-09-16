/**
 * Created by gramcha on 15/09/17.
 */
let lineByLine = require('n-readlines');
let MultiHashMap = require('multi-hashmap').MultiHashMap;
let indexCache = new MultiHashMap('key', 'tags');
const defaultIndexFilePath = 'tags';

function createIndex(fileList, indexfilepath) {
    if (!indexfilepath) {
        indexfilepath = defaultIndexFilePath;
    }
    console.log('indexing....');
    let fs = require('fs')
    let indexFile = fs.createWriteStream(indexfilepath);
    fileList.forEach((filename, index) => {
        // console.log("count ", index, " fname ", filename);
        let liner = new lineByLine(filename);
        let line;
        let lineNumber = 0;
        let offset = 0;
        while (line = liner.next()) {
            let str = line.toString('ascii');
            let lineLength = str.length;
            // console.log('Line ' + lineNumber + ': ' + str);
            //let match
            let newString = str.replace(/[^auto\s*|const\s*|unsigned\s*|signed\s*|register\s*|volatile\s*|static\s*][a-zA-Z0-9_-]* ([\*a-zA-Z0-9_-]{1,})/g, function (match, captureOne) {
                // console.log(captureOne);
                const indexLine = captureOne + '\t' + 'v' + '\t' + lineNumber + '\t' + filename + '\t' + offset + '\n';
                indexFile.write(indexLine);
                indexCache.insert(captureOne, {
                    'fname': filename,
                    'type': 'v',
                    'lineNo': lineNumber,
                    'offset': offset
                });
                // console.log(indexLine);
                // return captureOne;
            });
            //funcname match
            let fstr = line.toString('ascii');
            fstr.replace(/\w+ \w+\(.*\)/g, function (match, captureone) {
                // console.log('fname - ', captureone, ' match -', match);
                let words = match.split(' ');
                words = words[1].split('(');
                const indexLine = words[0] + '\t' + 'f' + '\t' + lineNumber + '\t' + filename + '\t' + offset + '\n';
                indexFile.write(indexLine);
                indexCache.insert(words[0], {
                    'fname': filename,
                    'type': 'f',
                    'lineNo': lineNumber,
                    'offset': offset
                });
                // console.log(indexLine);
                // return captureone;
            });
            offset = offset + lineLength + 1;//1 for \n
            lineNumber++;
        }
    });
    indexFile.end();
}

let parser = {createIndex, indexCache, defaultIndexFilePath};
module.exports = parser;