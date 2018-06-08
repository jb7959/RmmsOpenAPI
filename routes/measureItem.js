var express = require('express');
var router = express.Router();

//환경변수 파일 .env를 위한 dotenv설정
require('dotenv').config();

/*카산드라 드라이버*/ //https://github.com/datastax/nodejs-driver 참고
const cassandra = require('cassandra-driver');
//후보 컨텍포인트 지정가능
//const client = new cassandra.Client({ contactPoints: ['192.168.0.55:9042', '192.168.0.55:9042'], keyspace: 'sensordb' });
const client = new cassandra.Client({ contactPoints: [process.env.CASSA_CONP] , keyspace: process.env.CASSA_KS});

//쿼리 동작 안할때 예외처리
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here

});
//LOG 필요시
/*client.on('log', function(level, className, message, furtherInfo) {
    console.log('log event: %s -- %s', level, message);
});*/
//




/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/:id', function(req, res, next) {
    //req.accepts('application/json');

    let id = req.params.id;

    //GET start 값
    let start = req.query.start;
    let end = req.query.end;
    let afterStart= "";
    let afterEnd= "";
    let isRes400 = false;

    //req.query.* doesn't return Type of undefined, It returns String 'undefined'
    if(start!=='undefined'){
       afterStart = convertTimeFormatting (start, bfs => bfs.slice(0,4)+'-'+ bfs.slice(4,6) +'-'+ bfs.slice(6,8), bfs => ' '+bfs.slice(8,10)+':'+ bfs.slice(10,12)+':'+ bfs.slice(12,14));
    }
    if(end !=='undefined') {
       afterEnd = convertTimeFormatting (end, bfs => bfs.slice(0,4)+'-'+ bfs.slice(4,6) +'-'+ bfs.slice(6,8), bfs => ' '+bfs.slice(8,10)+':'+ bfs.slice(10,12)+':'+ bfs.slice(12,14));
    }
    if(isRes400){
        res.status(400).send(`Http Response Code 400, Please check you arguments. [Received argument | start : ${start}, end : ${end}]`);
    }else {
        getData(id,afterStart,afterEnd,res);
    }


    //20170810123040 --> 2017-08-10 12:30:40 형태로 변경함수
    function convertTimeFormatting(time,callBackYYMMDD,callBackHHMMSS){
        //년월일 -, . 인정, 시간사이 T,t, 공백인정
        let re = /[0-9]{4}(-|.)(0[1-9]|1[0-2])(-|.)(0[1-9]|[1-2][0-9]|3[0-1])( |T|t)(2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/;
        let isRight = time.match(re);
        let afterTime = '';

        //전체 년월일시분초 패턴 일치
        if(!isRight){
        //패턴매치하지 않을때
            //YYYY-mm-dd
            if(time.match(/[0-9]{4}(-|.)(0[1-9]|1[0-2])(-|.)(0[1-9]|[1-2][0-9]|3[0-1])/)){
                afterTime = time;
            }else {
                let yyyymmdd = time.slice(0,8);
                let hhmmss = time.slice(8,14);
                //14자리 이상 에러 (패턴매치가 아닐경우)
                if(time.length>14){
                    isRes400 = true;
                }
                if(yyyymmdd.match(/[0-9]{4}(0[1-9]|1[0-2])(0[1-9]|[1-2][0-9]|3[0-1])/)){
                    afterTime = callBackYYMMDD(time); //년월일까지 숫자만
                    if(time.length>8){ //시분초까지 숫자만
                        if(hhmmss.match(/(2[0-3]|[01][0-9])[0-5][0-9][0-5][0-9]/)||hhmmss.match(/(2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/)){
                            afterTime += callBackHHMMSS(time);
                        }else{
                            isRes400 = true;
                        }
                    }
                }else{
                    //년월일 숫자가 아니면 에러
                    isRes400 = true;
                }
            }
        }else {
            //전체 패턴 매치 YYYY-mm-DD HH:MM:SS
            if(time.length>19){
                isRes400 = true;
            }
            afterTime = time;
        }
        return afterTime;
    }

});

//출력예시
/*Row {
    id: '000494',
        etime: 2018-05-13T07:12:26.825Z,
        alarm: null,
        cat: null,
        measure:
    { amp: 0.003088,
        coId: 1,
        e1: 0,
        e2: 0,
        leakAmp: 0.011018,
        leakResi: 0.010736,
        ohm: 20.39484,
        volt: 218.96443,
        watt: 0.676121 },
    sub: 'netis' } ]*/



//지정시간부터 현재까지의 모든 ID의 측정값 호출, 클로저로 res 넘겨서 promise then에서 실행 (비동기로 함수가 실행되어서 res를 넘김)
function getData(id, start, end, res){
//고정쿼리방식
//const query = "select * from iotdata where id = '000494' and etime > '2018-05-11 11:06:45' and  etime <= '2018-05-11 12:08:45'";
 /*client.execute(query).then(result => console.log(result.rows));*/
//Prepare Query
    let query;
    //end가 없을 때,
    console.log(end);
    if(end==''){
        query = `select * from iotdata where id = '${id}' and etime >= '${start}'`;
        console.log(query);
    }else{
        query =  `select * from iotdata where id = '${id}' and etime >= '${start}' and etime <= '${end}'` ;
        console.log(query);
    }
    client.execute(query).then(result => res.json(result.rows));
}

/*
결과 ::::::::::::::::::::::
[
    {
        "id": "000494",
        "etime": "2018-05-13T04:10:35.216Z",
        "alarm": null,
        "cat": null,
        "measure": {
            "amp": 0.003113,
            "coId": 1,
            "e1": 0,
            "e2": 0,
            "leakAmp": 0.010664,
            "leakResi": 0.010441,
            "ohm": 21.07078,
            "volt": 219.99342,
            "watt": 0.684785
        },
        "sub": "netis"
    },{}......*/


module.exports = router;
