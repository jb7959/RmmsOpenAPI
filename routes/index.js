var express = require('express');
var router = express.Router();

//환경변수 파일 .env를 위한 dotenv설정
require('dotenv').config();

//JWT 토큰생성
let jwt = require('jsonwebtoken');
let SECRET = process.env.TOKEN_KESCO_KEY; //토큰의 대칭키

/* 기본루트 설정 */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/

// 모든 equipmentPOST 호출값 405에러 405 Method Not Allowed
router.post('/equipment/*', function (req, res, next) {
    res.send(405);
});

/* API 키생성 폼 */
router.get('/authenticator', function (req, res, next) {
    res.render('authForm', {title: 'KESCO API'});
});

// 토큰을 해석하여 유저 정보를 얻는 함수
// 에러: 토큰기간이 지났을때 : TokenExpiredError, 토큰대칭키가 다를때 및 토큰이 이상할떄 : JsonWebTokenError
function isAuthenticated(token) {
    try {
        let decoded = jwt.verify(token.trim(), SECRET);
        return decoded
    } catch (e) {
        return e.name;
    }
}

//optionNo가 1이면 측정값(카산드라), 2면 이벤트값(오라클)
router.get('/:id', function (req, res, next) {
    //토큰만료(TokenExpiredError), 토큰키 이상 (TokenExpiredError)이 아닐때, 혹은 AUTH_MANAGER_PW 값으로 들어올때.
    let flag = true;
    console.log(isAuthenticated(req.get('X-Auth-Token')));
    console.log(req.get('X-Auth-Token'));
    if (req.get('X-Auth-Token') === undefined) {
        flag = false;
        console.log('0');
    }
    if (isAuthenticated(req.get('X-Auth-Token')) === 'TokenExpiredError') {
        flag = false;
        console.log('TokenExpiredError:토큰키가 만료되었습니다.');
    }
    if (isAuthenticated(req.get('X-Auth-Token')) === 'JsonWebTokenError') {
        flag = false;
        console.log('TokenExpiredError:토큰키 이상');
    }
    if (req.get('X-Auth-Token') === process.env.AUTH_MANAGER_PW) {
        flag = true;
        console.log("현재 관리키를 사용하여 API가 인증되었습니다. (토큰키 만료 및 이상 해결 됨) [현재 입력된 관리키 : " + process.env.AUTH_MANAGER_PW+"]");
    }
    if (flag) {
        //option 1 : 이벤트
        if (req.query.option == 2) {
            console.log("start:::::::::::::getEventItems ");
            getdataFromOracle(req.params.id, res)
        } else if (req.query.option == 1) {
            console.log("start:::::::::::::getMesureItems ");
            getMesureItems(req, res);
        }
    } else {
        res.send(401);
    }
});

/////////////////////////////
/////////measureItems///////
//////////////////////////


/*카산드라 드라이버*/ //https://github.com/datastax/nodejs-driver 참고
const cassandra = require('cassandra-driver');

//후보 컨텍포인트 지정가능
const client = new cassandra.Client({contactPoints: [process.env.CASSA_CONP], keyspace: process.env.CASSA_KS});

//쿼리 동작 안할때 예외처리
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

//카산드라 LOG 활성화 application specific logging, throwing an error, or other logic here
/*client.on('log', function(level, className, message, furtherInfo) {
    console.log('log event: %s -- %s', level, message);
});*/

function getMesureItems(req, res) {
    //req.accepts('application/json');

    let id = req.params.id;
    let start = req.query.start;
    let end = req.query.end;
    let afterStart = "";
    let afterEnd = "";
    let isRes400 = false;

    if (start !== undefined) {
        obj = convertTimeFormatting(start, bfs => bfs.slice(0, 4) + '-' + bfs.slice(4, 6) + '-' + bfs.slice(6, 8), bfs => ' ' + bfs.slice(8, 10) + ':' + bfs.slice(10, 12) + ':' + bfs.slice(12, 14));
        afterStart = obj.afterTime;
        isRes400 = obj.isRes400;
    }
    if (end !== undefined) {
        obj = convertTimeFormatting(end, bfs => bfs.slice(0, 4) + '-' + bfs.slice(4, 6) + '-' + bfs.slice(6, 8), bfs => ' ' + bfs.slice(8, 10) + ':' + bfs.slice(10, 12) + ':' + bfs.slice(12, 14));
        afterEnd = obj.afterTime;
        isRes400 = obj.isRes400;
    }
    if (isRes400) {
        res.status(400).send(`Http Response Code 400, Please check you arguments. [Received argument | start : ${start}, end : ${end}]`);
    } else {
        getDataFromCassandra(id, afterStart, afterEnd, res);
    }
}

//지정시간부터 현재까지의 모든 ID의 측정값 호출
function getDataFromCassandra(id, start, end, res) {
    //Prepare Query
    let query;
    //end가 없을 때,
    if (end == '') {
        query = `select * from iotdata where id = '${id}' and etime >= '${start}'`;
        console.log(query);
    } else {
        query = `select * from iotdata where id = '${id}' and etime >= '${start}' and etime <= '${end}'`;
        console.log(query);
    }
    client.execute(query).then(result => res.json(result.rows)); //클로저로 res 넘겨서 promise then에서 실행 (비동기로 함수가 실행되어서 res를 넘김)
}

//20170810123040 --> 2017-08-10 12:30:40 형태로 변경함수
function convertTimeFormatting(time, callBackYYMMDD, callBackHHMMSS) {
    //년월일 -, . 인정, 시간사이 T,t, 공백인정
    let re = /[0-9]{4}(-|.)(0[1-9]|1[0-2])(-|.)(0[1-9]|[1-2][0-9]|3[0-1])( |T|t)(2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/;
    let isRight = time.match(re);
    let afterTime = '';
    let isRes400 = false;
    //전체 년월일시분초 패턴 일치
    if (!isRight) {
        //패턴매치하지 않을때
        //YYYY-mm-dd
        if (time.match(/[0-9]{4}(-|.)(0[1-9]|1[0-2])(-|.)(0[1-9]|[1-2][0-9]|3[0-1])/)) {
            afterTime = time;
        } else {
            let yyyymmdd = time.slice(0, 8);
            let hhmmss = time.slice(8, 14);
            //14자리 이상 에러 (패턴매치가 아닐경우)
            if (time.length > 14) {
                isRes400 = true;
            }
            if (yyyymmdd.match(/[0-9]{4}(0[1-9]|1[0-2])(0[1-9]|[1-2][0-9]|3[0-1])/)) {
                afterTime = callBackYYMMDD(time); //년월일까지 숫자만
                if (time.length > 8) { //시분초까지 숫자만
                    if (hhmmss.match(/(2[0-3]|[01][0-9])[0-5][0-9][0-5][0-9]/) || hhmmss.match(/(2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/)) {
                        afterTime += callBackHHMMSS(time);
                    } else {
                        isRes400 = true;
                    }
                }
            } else {
                //년월일 숫자가 아니면 에러
                isRes400 = true;
            }
        }
    } else {
        //전체 패턴 매치 YYYY-mm-DD HH:MM:SS
        if (time.length > 19) {
            isRes400 = true;
        }
        afterTime = time;
    }
    return {afterTime: afterTime, isRes400: isRes400}; //object
}

///////////mesureItems End//////////////

/////////////////////////////
/////////eventItem//////////
///////////////////////////

//oracledb 연동
var oracledb = require('oracledb');


function getdataFromOracle(equipSeq, res) {

//oracle 연동시작 (.env에 설정)
    oracledb.getConnection(
        {
            user: process.env.ORA_USER,
            password: process.env.ORA_PW,
            connectString: process.env.ORA_CON
        },
        function (err, connection) {
            if (err) {
                console.error(err.message);
                return;
            }
            connection.execute(
                `SELECT
                (SELECT EVENT_NM FROM RM_EVENT B WHERE B.EVENT_MGNO = A.EVENT_OCCU_DESC) AS EVENT_NM,
                 A.OCCU_DT,
                (SELECT SITE_NM FROM RM_SITE B WHERE B.SITE_SEQ = A.SITE_SEQ) AS SITE_NM,
                A.EQUIP_SEQ,
                (SELECT EQUIP_NM FROM RM_EQUIP B WHERE B.EQUIP_SEQ = A.EQUIP_SEQ) AS EQUIP_NM,
                A.REDG_VAL,
                (SELECT CD_NM FROM RM_CODE B WHERE B.CD_GRP_SEQ = 610 AND B.CD_ID = A.EVENT_LVCD) AS EVENT_LEVEL,
                (SELECT CD_NM FROM RM_CODE B WHERE B.CD_GRP_SEQ = 300 AND B.CD_ID = A.RMRK_RTCD) AS RMRK_RSLT,
                RMRK_RSLT_DT
                FROM RM_EVENT_OCCU A WHERE EQUIP_SEQ  = :seq`,
                // WHERE manager_id = :id`,
                [equipSeq],  // bind value for :id
                function (err, result) {
                    if (err) {
                        console.error(err.message);
                        doRelease(connection);
                        return;
                    }
                    //리턴 결과가 없을 경우
                    if (result.rows.length == 0) {
                        res.send(404);
                    } else {
                        var returnJson = convertArrayToJson(result.rows) //JSON으로 변환된 데이터 할당
                        res.json(returnJson);
                        console.log(returnJson);
                    }
                    doRelease(connection);
                });
        });

    function doRelease(connection) {
        connection.close(
            function (err) {
                if (err)
                    console.error(err.message);
            });
    }

    function convertArrayToJson(array) {
        var objList = new Array();
        for (var i in array) {
            var obj = {
                eventName: array[i][0], //이벤트명
                occurrenceTime: array[i][1], //발생시간
                siteName: array[i][2], //현장명
                equipmentSeq: array[i][3], //측정장치순번
                equipmentName: array[i][4], //측정장치명
                measureValue: array[i][5], //측정값
                eventLevel: array[i][6], //이벤트 경보수준
                handlingResult: array[i][7], //처리결과 (이벤트레벨이 0 이면 null)
                handlingTime: array[i][8] // 처리시간 (이벤트레벨이 0 이면 null)
            };
            objList.push(obj);
        }
        return objList;
    }
}
//////////////////////////

module.exports = router;
