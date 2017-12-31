var express = require('express');
var app = express();
var fs = require('fs');
var session = require('express-session');
var configFile = './config.json';
var config = JSON.parse(fs.readFileSync(configFile));
var bodyParser = require('body-parser');
var FileStore = require('session-file-store')(session);
app.use(bodyParser.urlencoded({ extended: false }))

var identityKey = 'skey';

app.use(session({
    name: identityKey,
    secret: 'nb', // 用来对session id相关的cookie进行签名
    store: new FileStore(), // 本地存储session（文本文件，也可以选择其他store，比如redis的）
    saveUninitialized: false, // 是否自动保存未初始化的会话，建议false
    resave: false, // 是否每次都重新保存会话，建议false
    cookie: {
        maxAge: 100 * 1000 // 有效期，单位是毫秒
    }
}));

app.post('/serverLogin', function(req, res, next) {
    console.log('login!!!!!!');
    var sess = req.session;
    var type = req.body.type;
    var password = req.body.password;
    var able = false;
    if (type == 'Server' && password == config.serverPassword) {
        able = true;
    } else if (type == 'Administrator' && password == config.administratorPassword) {
        able = true;
    } else if (type == 'Screen' && password == config.screenPassword) {
        able = true;
    }
    if (able) {
        req.session.regenerate(function(err) {
            if (err) {
                res.send('登录失败');
            }
            req.session.serverLogined = true;
            res.send('登录成功');
        })
    } else {
        res.send('密码错误');
    }
})

app.get('/serverLogout', function(req, res, next) {
    req.session.destroy(function(err) {
        if (err) {
            return;
        }
        res.clearCookie(identityKey);
        res.redirect('/');
    })
})

app.get(/\/pages\/.*$/, function(req, res, next) {
    var sess = req.session;
    if (sess.serverLogined) {
        //res.send('已经登录');
        return next();
    } else {
        res.send('还未登录');
    }
})

app.use(express.static('www'));

var server = app.listen(3000, function() {
    console.log('start');
    console.log(config.serverPassword);
});