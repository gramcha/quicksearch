/**
 * Created by gramcha on 15/09/17.
 */
let fs = require('fs');
let readline = require('readline');
let lineByLine = require('n-readlines');
let forParallel = require('node-in-parallel');

function appendResult(words, resultList,line) {
    let result = {
        'fname': words[3],
        'lineNo': parseInt(words[2]),
        'indexline':line//debug purpose
    };
    resultList.push(result);
}
function findFromIndexFile(indexFilepath, searchString, isFunctionType, callback) {
    let t1 = new Date();
    let resultList = [];
    readline.createInterface({
        input: fs.createReadStream(indexFilepath,),
        terminal: false
    }).on('line', function (line) {
        // console.log(line);
        let idx = line.indexOf(searchString);
        if (idx !== -1) {
            let words = line.split('\t');
            if (words.length > 0) {
                if (words[0] === searchString) {
                    if (isFunctionType === true) {
                        // console.log('_'+words[1]+'_');
                        // console.log(line + '\n');
                        if (words[1] === 'f') {
                            appendResult(words, resultList,line);
                        }
                    } else {
                        appendResult(words, resultList,line);
                    }

                }
            }
            // console.log(line + '\n');
        }
    }).on('close', function () {
        let t2 = new Date();
        console.log('tags parsing',(t2-t1)/1000);
        callback(resultList);
    });
}

function findCodeSnippet(indexFilepath, searchString, isFunctionType, callback) {
    findFromIndexFile(indexFilepath, searchString, isFunctionType, (resultList) => {
        let t1 = new Date();
        resultList.forEach((element, index) => {
            let liner = new lineByLine(element.fname);
            let line;
            let lineNumber = 0;
            let startLineNumber = element.lineNo;
            let endLineNumber = element.lineNo + 5;
            // console.log('start-',startLineNumber,' end-',endLineNumber);
            let snippet = []
            while (line = liner.next()) {
                lineNumber++;
                if (lineNumber >= startLineNumber)
                    snippet.push(line.toString('ascii'));
                if (lineNumber > endLineNumber)
                    break;
            }
            element.snippet = snippet;
        });
        let t2 = new Date();
        console.log('result files parsing',(t2-t1)/1000);
        callback(resultList);

        // let t1 = new Date();
        // forParallel(resultList, function(element) {
        //     let liner = new lineByLine(element.fname);
        //     let line;
        //     let lineNumber = 0;
        //     let startLineNumber = element.lineNo;
        //     let endLineNumber = element.lineNo + 5;
        //     // console.log('start-',startLineNumber,' end-',endLineNumber);
        //     let snippet = []
        //     while (line = liner.next()) {
        //         lineNumber++;
        //         if (lineNumber >= startLineNumber)
        //             snippet.push(line.toString('ascii'));
        //         if (lineNumber > endLineNumber)
        //             break;
        //     }
        //     element.snippet = snippet;
        // }, function () {
        //     let t2 = new Date();
        //     console.log('result files parsing',(t2-t1)/1000);
        //     callback(resultList);
        // });

    });
}
let query = {findFromIndexFile, findCodeSnippet};
module.exports = query;

