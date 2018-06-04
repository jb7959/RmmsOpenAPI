var express = require('express');
var router = express.Router();

/*카산드라 드라이버*/ //https://github.com/datastax/nodejs-driver 참고
const cassandra = require('cassandra-driver');
//후보 컨텍포인트 지정가능
//const client = new cassandra.Client({ contactPoints: ['192.168.0.55:9042', '192.168.0.55:9042'], keyspace: 'sensordb' });
const client = new cassandra.Client({ contactPoints: ['192.168.0.55:9042'] , keyspace: 'sensordb'});

//고정쿼리방식
//const query = "select * from iotdata where id = '000494' and etime > '2018-05-11 11:06:45' and  etime <= '2018-05-11 12:08:45'";

/*client.execute(query)
    .then(result => console.log(result.rows));*/


//Prepare Query
const query = "select * from iotdata where id = ? and etime > ?";


//yyyy-MM-DD hh:mm:ss 파싱 및 변환 함수 필요

const params = ['000494','2018.05.13'];

client.execute(query, params, {prepare: true})
    .then(result => console.log(result.rows));


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

module.exports = router;
