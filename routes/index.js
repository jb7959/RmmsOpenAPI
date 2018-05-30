var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/equipment/:id/:optionNo', function(req, res, next) {
    var url = "/";
    console.log(req.params.optionNo);
    if(req.params.optionNo == 2){
      url = "/eventItems/"+ req.params.id;
    }else if(req.params.optionNo == 1){
      url = "/measureItems/"+ req.params.id;
    }
    res.redirect(url);
});
//http://localhost:3000/equipment/20019/2

module.exports = router;
