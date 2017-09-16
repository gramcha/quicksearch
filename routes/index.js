/**
 * Created by gramcha on 16/09/17.
 */
let  express = require('express');
let  router = express.Router();
let  query = require('../query');

router.get('/', function(req, res, next) {
    console.log('req.query.keyword -',req.query.keyword,'req.query.isfunc -',req.query.isfunc);
    let t3 = new Date();
    query.findCodeSnippet('tags',req.query.keyword,req.query.isfunc === 'true',(resultlist)=>{
        let t4 = new Date();
        // console.log("resultlist ",resultlist);
        // console.log("result count - ",resultlist.length);
        console.log('time in msec',(t4-t3));
        res.send({"count":resultlist.length,"result":resultlist,"querytime(secs)":(t4-t3)/1000});
    });
    // res.send('hello, world!'+req.query.keyword+' - is func '+req.query.isfunc);
});

module.exports = router;