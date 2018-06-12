var express = require('express');
var router = express.Router();

//환경변수 파일 .env를 위한 dotenv설정
require('dotenv').config();

//todo module로 분리
//JWT 토큰생성
let jwt = require('jsonwebtoken');
let SECRET = process.env.TOKEN_KESCO_KEY; //토큰의 대칭키

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/

/* API 키생성 폼 */
router.get('/authenticator', function(req, res, next) {
    res.render('authForm', { title: 'KESCO API' });
});

// 토큰을 해석하여 유저 정보를 얻는 함수
// 에러: 토큰기간이 지났을때 : TokenExpiredError, 토큰대칭키가 다를때 및 토큰이 이상할떄 : JsonWebTokenError
function isAuthenticated(token) {
    try {
        let decoded = jwt.verify(token.trim(),SECRET);
        return decoded
    }catch (e) {
        return e.name;
    }
}

//optionNo가 1이면 측정값(카산드라), 2면 이벤트값(오라클)
router.get('/:id', function(req, res, next) {
    //토큰만료(TokenExpiredError), 토큰키 이상 (TokenExpiredError)이 아닐때, 혹은 AUTH_MANAGER_PW 값으로 들어올때.
    let flag  = true;
    console.log(isAuthenticated(req.get('X-Auth-Token')));
    console.log(req.get('X-Auth-Token'));
    if(req.get('X-Auth-Token')===undefined){flag = false; console.log('0')}
    if(isAuthenticated(req.get('X-Auth-Token'))==='TokenExpiredError'){flag = false; console.log('1')}
    if(isAuthenticated(req.get('X-Auth-Token'))==='JsonWebTokenError'){flag = false; console.log('2')}
    if(req.get('X-Auth-Token')===process.env.AUTH_MANAGER_PW){flag = true; console.log('3')}
    if(flag){
        var url = "/";
        console.log(req.params.optionNo);
        //optionNo 1 : 이벤트
        if(req.query.option == 2){
            url = "/eventItems/"+ req.params.id ;
        }else if(req.query.option == 1){
            url = "/measureItems/"+ req.params.id +"?start="+req.query.start +"&end="+req.query.end;
        }
        res.redirect(url);
    }else {
        res.send(401)
    }

});

// 모든 equipmentPOST 호출값 405에러 405 Method Not Allowed
router.post('/equipment/*', function (req, res, next) {
    res.send(405);
});

module.exports = router;
