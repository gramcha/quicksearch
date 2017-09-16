/**
 * Created by gramcha on 15/09/17.
 */
var utils = require('./utils/common');
var parser = require('./parser');
var query = require('./query');

let filelist = utils.getFileList('./../redis/');
let t1 = new Date();
// filelist = ['/Users/gramcha/source/trials/redis/src/rand.c'];
parser.createIndex(filelist,'tags');
let t2 = new Date();

console.log('index creattion time',(t2-t1)/1000);

let t3 = new Date();
//redisLrand48
query.findCodeSnippet('tags','redisLrand48',true,(resultlist)=>{
    let t4 = new Date();
    // console.log("resultlist ",resultlist);
    console.log("result count - ",resultlist.length);
    console.log((t4-t3)/1000);
});

// var fs = require('fs');
// let readline = require('readline');
// let read = false;
// //
// let fp = fs.openSync('/Users/gramcha/source/trials/redis/00-RELEASENOTES','r');
// // let fd = fs.createReadStream(null,{start: 129,fd:fp});
// // console.log('===========');
// //
// // console.log(fd);
// // console.log('===========');
// readline.createInterface({
//     input: fs.createReadStream(null,{fd:fp,start: 130}),
//     terminal: false
// }).on('line', function (line) {
//     if(false === read && line.length >0)
//     {
//         console.log("length-",line.length);
//         console.log(line);
//         read = true;
//     }
// }).on('close', function () {
//
// });