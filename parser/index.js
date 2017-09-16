/**
 * Created by gramcha on 15/09/17.
 */
let lineByLine = require('n-readlines');

function createIndex(fileList, indexfilepath) {
    console.log('indexing....');
    let fs = require('fs')
    let indexFile = fs.createWriteStream(indexfilepath/*, {
     flags: 'a' // 'a' means appending (old data will be preserved)
     }*/);
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
                const indexLine = captureOne + '\t' + 'v' + '\t' + lineNumber + '\t' + filename +'\t'+offset +'\n';
                indexFile.write(indexLine);
                // console.log(indexLine);
                // return captureOne;
            });
            //funcname match
            let fstr = line.toString('ascii');
            fstr.replace(/\w+ \w+\(.*\)/g, function (match, captureone) {
                // console.log('fname - ', captureone, ' match -', match);
                let words = match.split(' ');
                words = words[1].split('(');
                const indexLine = words[0] + '\t' + 'f' + '\t' + lineNumber + '\t' + filename +'\t'+offset + '\n';
                indexFile.write(indexLine);
                // console.log(indexLine);
                // return captureone;
            });
            offset = offset + lineLength + 1;//1 for \n
            lineNumber++;
        }
    });
    indexFile.end();
}

let parser = {createIndex};
module.exports = parser;