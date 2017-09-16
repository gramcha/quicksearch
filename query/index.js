/**
 * Created by gramcha on 15/09/17.
 */
let fs = require('fs');
let readline = require('readline');
let lineByLine = require('n-readlines');
let forParallel = require('node-in-parallel');
const NodeCache = require("node-cache");
const expiryResultCache = new NodeCache();

let parser = require('./../parser');

const defaultTTL = 900;//seconds=>15 minutes

function appendResult(words, resultList, line) {
    let result = {
        'fname': words[3],
        'lineNo': parseInt(words[2]),
        // 'indexline':line,//debug purpose
        'offset': parseInt(words[4])
    };
    resultList.push(result);
}
function findFromCache(searchString, isFunctionType, callback) {
    let tempList = parser.indexCache.findAll('key', searchString);
    // console.log('key-',searchString,' key count -',tempList.length,' isFunctionType-', typeof isFunctionType);
    let resultList = [];
    tempList.forEach((item) => {
        // console.log("item",item[1]);
        if (isFunctionType === true) {
            if (item[1].type === 'f')
                resultList.push(item[1]);
        } else
            resultList.push(item[1]);
    });
    // console.log("result count -",resultList.length);
    callback(resultList);
}
function findFromIndexFile(indexFilepath, searchString, isFunctionType, callback) {
    console.log("isFunctionType", isFunctionType);
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
                if (words[0] === searchString) {//convert this as contains
                    if (isFunctionType === true) {
                        console.log('_' + words[1] + '_');
                        console.log(line + '\n');
                        if (words[1] === 'f') {
                            appendResult(words, resultList, line);
                        }
                    } else {
                        console.log('.');
                        appendResult(words, resultList, line);
                    }

                }
            }
            // console.log(line + '\n');
        }
    }).on('close', function () {
        let t2 = new Date();
        console.log('tags parsing', (t2 - t1) / 1000);
        callback(resultList);
    });
}

function findCodeSnippet(indexFilepath, searchString, isFunctionType, callback) {
    const resulCacheKey = searchString+' '+isFunctionType;
    const cachedResult = expiryResultCache.get(resulCacheKey);
    if(cachedResult !== undefined){
        callback(cachedResult);
    }else{
        if (parser.indexCache) {
            console.log('loading from index cache');
            findFromCache(searchString, isFunctionType, (resultList) => {
                if(resultList.length<1){
                    callback(resultList);
                }
                // console.log("creating snippets");
                constructSnippet(resultList, () => {
                    expiryResultCache.set(resulCacheKey, resultList, defaultTTL);
                    callback(resultList);
                });
            });
        } else {
            console.log('index cache not found, loading from file');
            if (!indexFilepath)
                indexFilepath = parser.defaultIndexFilePath;
            findFromIndexFile(indexFilepath, searchString, isFunctionType, (resultList) => {
                if(resultList.length<1){
                    callback(resultList);
                }
                constructSnippet(resultList, () => {
                    expiryResultCache.set(resulCacheKey, resultList, defaultTTL);
                    callback(resultList);
                });
            });
        }
    }
}

function constructSnippet(resultList, callback) {
    // console.log('----');
    let t1 = new Date();
    /*method 1 - synchronously read each file from 0 to resultline +5.
     * this method seems to be fine when your search results file counts are less.
     * But this takes more time to complete if the result file count is huge.
     * For Example: finding 'a' in index file as not a function results in 2546.
     * reading each file to create snippet takes ~2.789 secs.
     * */
    // resultList.forEach((element, index) => {
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
    // });
    // let t2 = new Date();
    // console.log('result files parsing',(t2-t1)/1000);
    // callback();


    /*method 2 - asynchronously read each file from 0 to resultline +5.
     * this method seems to be fine when your search results file counts are less.
     * But this takes more time to complete if the result file count is huge.
     * For Example: finding 'a' in index file as not a function results in 2546.
     * reading each file to create snippet takes ~2.963.
     * Here aync did not reduce time instead it increases slightly compare to method1.
     * */
    // forParallel(resultList, function(element) {
    //     let liner = new lineByLine(element.fname);
    //     let line;
    //     let lineNumber = 0;
    //     let startLineNumber = element.lineNo;
    //     let endLineNumber = element.lineNo + 5;
    //     // console.log('start-',startLineNumber,' end-',endLineNumber);
    //     let snippet = [];
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
    //     callback();
    // });

    /*method 3 - asynchronously read each file.But initialize file descriptor to the result line
     * instead of reading from line zero(fd=0) to result line
     * this takes less time to complete if the result file count is huge.
     * For Example: finding 'a' in index file as not a function results in 2546.
     * reading each file to create snippet takes ~0.993 secs. It takes 1/3 of time compare to other methods.
     * */
    let completedcount = 0;
    // console.log("resultList length - ",resultList.length);
    resultList.forEach(function (element, index) {
        // console.log('index -',index,'fname -',element.fname,'lineNo-',element.lineNo);
        // console.log('index -',index,' element -',element);
        function complete(index) {
            completedcount++;
            if (resultList.length === completedcount) {
                let t2 = new Date();
                console.log('result files parsing', (t2 - t1) / 1000);
                callback();
            }
        }

        let readCompleted = false;//stop reading at end line. even though stream going to emit line.
        let fd = fs.openSync(element.fname, 'r');
        let stream = fs.createReadStream(null, {fd: fd, start: element.offset});
        let lineNumber = element.lineNo;
        let startLineNumber = element.lineNo;
        let endLineNumber = element.lineNo + 5;
        let snippet = [];
        try {
            readline.createInterface({
                input: stream,
                terminal: false
            }).on('line', function (line) {
                if (false === readCompleted && line.length > 0) {
                    // console.log("length-", line.length);
                    // console.log(line);
                    lineNumber++;
                    // if (lineNumber >= startLineNumber)
                    snippet.push(line.toString('ascii'));
                    if (lineNumber > endLineNumber) {
                        // console.log("completing ",'index -',index,'fname -',element.fname);
                        readCompleted = true;
                        element.snippet = snippet;
                        complete(index);
                    }
                }
                // console.log('******');
            }).on('close', function () {
                if (readCompleted === false) {
                    element.snippet = snippet;
                    complete(index);
                }
            });
        } catch (err) {

        }
    });
}
let query = {findFromIndexFile, findCodeSnippet};
module.exports = query;

