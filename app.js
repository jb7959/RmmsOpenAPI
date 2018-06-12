var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('jsonwebtoken');

//컨트롤러 분배
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var measureItemRouter = require('./routes/measureItem');
var eventItemRouter = require('./routes/eventItemRouter');
var authToken = require('./routes/authToken');

var app = express();

//환경변수 파일 .env를 위한 dotenv설정
require('dotenv').config();

//swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // https://editor.swagger.io/에서 수정 및 제작가능

//swagger-ui-express CSS,JS 옵션
var options = {
    //customCss: '.swagger-ui .topbar { content:url("") }'
    customCss: `.swagger-ui .topbar-wrapper img[alt="Swagger UI"],
                .topbar-wrapper span {
                  visibility: hidden;
                 }
                .topbar-wrapper span:after {
                    content: ' ';
                    background-image: url('/images/api_logo.png');
                    background-repeat: no-repeat;
                    back 
                    color: #fsfsff;
                    width: 307px;
                    height:36px;
                    visibility: visible;
                    display: block;
                    position: absolute;
                    padding: 5px;
                    top: 1%;
                    left: 3%;
                },`
    /*customJs: '/custom.js'*/
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//body-parser
//const bodyParser = require('body-parser');
//app.use(bodyParser);
app.use(express.json());
//11442
//컨트롤러 분배 적용
app.use('/equipment', indexRouter);
app.use('/eventItems', eventItemRouter);
app.use('/users', usersRouter);
app.use('/measureItems', measureItemRouter);
app.use('/authToken', authToken);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
