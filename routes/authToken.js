//익스프레스
var express = require('express');
var router = express.Router();

//환경변수 파일 .env를 위한 dotenv설정
require('dotenv').config();

//JWT 토큰생성
let jwt = require('jsonwebtoken');
let SECRET = process.env.TOKEN_KESCO_KEY; //토큰의 대칭키
let EXPIRES = (4 * 7 * 24 * 60); // API 키 유지 기간 한달 (4주*7일*24시간*60분)

/* API 키생성 폼 */
router.post('/new', function(req, res, next) {
    console.log(req.body.AUTH_MANAGER_PW);
    if(req.body.AUTH_MANAGER_PW === process.env.AUTH_MANAGER_PW){
        token = signToken(req.body.name, req.body.email, req.body.phone);
        res.render('authTokenInfo', { title: 'KESCO API 토큰발급정보', name:req.body.name, token:token});
    }else {
        //.env 파일에 설정된 AUTH_MANAGER_PW 값 확인 필요. (기본값 : krystaloh@kesco.or.kr)
        res.render('authTokenInfo', { title: 'KESCO API 토큰발급정보', name:'KESCO', token:"관리자 승인번호를 확인해주세요."});
    }
});

// JWT 토큰 생성 함수
function signToken(name, email, phone) {
    return jwt.sign({name: name, email: email, phone: phone}, SECRET, { expiresIn: EXPIRES });
}

// 토큰을 해석하여 유저 정보를 얻는 함수
// 에러: 토큰기간이 지났을때 : TokenExpiredError, 토큰대칭키가 다를때 및 토큰이 이상할떄 : JsonWebTokenError
function isAuthenticated(token) {
    try {
        let decoded = jwt.verify(token,SECRET);
        return decoded
    }catch (e) {
        return e.name;
    }
}

exports.signToken = signToken;
exports.isAuthenticated = isAuthenticated;

module.exports = router;
