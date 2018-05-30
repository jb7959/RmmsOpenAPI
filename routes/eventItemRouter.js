var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    //req.accepts('application/json');
    res.json({ message: 'hooray! welcome to our api!' });
});

module.exports = router;
