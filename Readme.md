[참고] 각 URI의 자원호출 HTTP method는 GET입니다. 각 헤더에는 Token이 필요합니다.
HTTP header에 X-Auth-Token : 토큰값 을 보내주세요. (예 X-Auth-Token: d123123124125fdfasfa124124sfaq2)

0. API-DOCS
http://localhost:3000/api-docs/

1. 현재 데이터 검색
1.1 기간조회 (년월일)
http://localhost:3000/equipment/000494/?option=1&start=20180513&end=20180514
http://localhost:3000/equipment/000494/?option=1&start=2018-05-13&end=2018-05-14

1.1.1 기간조회 (년월일 시분초)
http://localhost:3000/equipment/000494/?option=1&start=2018-05-11 10:10:10&end=2018-05-14 12:12:12

1.2 기간조회(년월일 시작값만)
http://localhost:3000/equipment/000494/?option=1&start=20180513
http://localhost:3000/equipment/000494/?option=1&start=2018-05-13

1.3 기간조회(년월일 시분초 시작값만)
http://localhost:3000/equipment/000494/?option=1&start=2018-05-12 10:10:10

2. 이벤트 데이터 조회
http://localhost:3000/equipment/3020/?option=2

3. Token 발급 
http://localhost:3000/authenticator