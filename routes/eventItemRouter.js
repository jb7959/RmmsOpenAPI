var express = require('express');
var router = express.Router();

//토큰확인용
var jwt = require('jsonwebtoken');

//oracledb 연동
var oracledb = require('oracledb');

//환경변수 파일 .env를 위한 dotenv설정
require('dotenv').config();

/* GET 이벤트 항목 정보. */
router.get('/:id', function(req, res, next) {
    //req.accepts('application/json');
    getData(req.params.id,res);
});

router.post('/*', function (req, res, next) {
    res.send(405);
});

function getData(equipSeq, res) {

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
                    if(result.rows.length == 0){
                        res.send(404);
                    }else{
                        var  returnJson = convertArrayToJson(result.rows) //JSON으로 변환된 데이터 할당
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
    
    function convertArrayToJson(array){
        var objList = new Array();
        for (var i in array){
            var obj = {
                eventName : array[i][0].trim(), //이벤트명
                occurrenceTime :array[i][1], //발생시간
                siteName : array[i][2], //현장명
                equipmentSeq : array[i][3], //측정장치순번
                equipmentName : array[i][4], //측정장치명
                measureValue : array[i][5], //측정값
                eventLevel : array[i][6], //이벤트 경보수준
                handlingResult : array[i][7], //처리결과 (이벤트레벨이 0 이면 null)
                handlingTime: array[i][8] // 처리시간 (이벤트레벨이 0 이면 null)
            };

            objList.push(obj);
        } 
        return objList;
    }
}



module.exports = router;
