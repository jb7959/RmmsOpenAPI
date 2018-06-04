var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/equipment/:id/:optionNo', function(req, res, next) {
    var url = "/";
    console.log(req.params.optionNo);
    //optionNo 1 : 이벤트
    if(req.params.optionNo == 2){
      url = "/eventItems/"+ req.params.id;
    }else if(req.params.optionNo == 1){
      url = "/measureItems/"+ req.params.id;
    }
    res.redirect(url);
});
//http://localhost:3000/equipment/20019/2

//todo POST를 쓸일이 있다면, 여기서 분기 18.05.31
// 모든 POST 호출값 405에러 405 Method Not Allowed
router.post('/*', function (req, res, next) {
    res.send(405);
});


module.exports = router;
