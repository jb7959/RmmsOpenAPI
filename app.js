var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//컨트롤러 분배
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var measureItemRouter = require('./routes/measureItem');
var eventItemRouter = require('./routes/eventItemRouter');

var app = express();

//환경변수 파일 .env를 위한 dotenv설정
require('dotenv').config();


//swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // https://editor.swagger.io/에서 수정 및 제작가능
//const swaggerSpec = swaggerJSDoc(options);
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//컨트롤러 분배 적용
app.use('/', indexRouter);
app.use('/eventItems', eventItemRouter);
app.use('/users', usersRouter);
app.use('/measureItems', measureItemRouter);

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
