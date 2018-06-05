var express = require('express');
var router = express.Router();

/*카산드라 드라이버*/ //https://github.com/datastax/nodejs-driver 참고
const cassandra = require('cassandra-driver');
//후보 컨텍포인트 지정가능
//const client = new cassandra.Client({ contactPoints: ['192.168.0.55:9042', '192.168.0.55:9042'], keyspace: 'sensordb' });
const client = new cassandra.Client({ contactPoints: ['192.168.0.55:9042'] , keyspace: 'sensordb'});

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
    //GET start 값
    let start = req.query.start;

    let afterStart= "";

    //IIFE를 활용한 콜백 및 클로저 사용(화살표연산자포함)
    (function(start,callBack){
        afterStart = callBack(start);
    })(start, bfs => bfs.slice(0,4)+'-'+ bfs.slice(4,6) +'-'+ bfs.slice(6,8));

    getData(req.params.id,res);
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



//지정시간부터 현재까지의 모든 ID의 측정값 호출
function getData(id, time){
//고정쿼리방식
//const query = "select * from iotdata where id = '000494' and etime > '2018-05-11 11:06:45' and  etime <= '2018-05-11 12:08:45'";
 /*client.execute(query).then(result => console.log(result.rows));*/

//Prepare Query
    const query = "select * from iotdata where id = ? and etime > ?";

//yyyy-MM-DD hh:mm:ss 파싱 및 변환 함수 필요
    const params = [id,'2018.05.13'];
    client.execute(query, params, {prepare: true})
        .then(result => console.log(result.rows));
}

module.exports = router;
