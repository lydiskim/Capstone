var express = require('express');
var mysql = require('mysql');
var app = express();
var fs = require('fs');

var pw = fs.readFileSync('password','utf-8');
pw = pw.substring(0,pw.length-1);

app.get('/',function(req,res){ 
    res.sendFile('/home/pi/work1/');
    console.log("accessed - "+req.ip);
});

var connection = mysql.createConnection({
    host:'localhost',
    port:3306,
    user:'root',
    password:pw,
    database:'Capstone'
});

connection.connect(function(err){
    if(err){
        console.log(err);
    }
});

app.get('/transmit',function(req,res){  // Getting informations from the query and write them on log file
    
    var user_data = {};
    user_data['temperature'] = req.query.temperature;
    user_data['co'] = req.query.co;
    user_data['humidity'] = req.query.humidity;
    
// for문 안에서 connection.query를 다 수행하지 않고 아래로 진행. connection.query의 call 시간이 늦게 되는 거라 (test.js 참고) callback 함수를 아예 함수로 처리하게 함.
    (function(user_data){connection.query("insert into data_forestFire values ('" + user_data['temperature'] + "', '" + user_data['co'] + "', '" + user_data['humidity'] + "');")})(user_data);

	 //fs.appendFile("/home/pi/Capstone_main/log.txt",JSON.stringify(user_data)+'\n',function(err){});
    res.redirect('/');
});

app.use('/static', express.static('/home/pi/work1/')); // To use directory's data in web server

app.listen(2323, function(){}); // Running web server in port 2323

