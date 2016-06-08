var express = require('express');
var mysql = require('mysql');
var app = express();
var fs = require('fs');
var async = require('async');
var request = require('request');

var pw = fs.readFileSync('password','utf-8');
pw = pw.substring(0,pw.length-1);

function abs(x) {
  x = +x;
  return (x > 0) ? x : 0 - x;
}

var mysql_connection = mysql.createConnection({
    host:'localhost',
    port:3306,
    user:'root',
    password:pw,
    database:'Capstone'
});

mysql_connection.connect(function(err){
    if(err){
        console.log(err);
    }
});

app.get('/',function(req,res){ 
    res.sendFile('/home/pi/work1/');
    console.log("accessed - "+req.ip);
});

app.get('/transmit',function(req,res){  // Getting informations from the query and write them on log file
    
    var user_data = {};
    var url = "http://know.nifos.go.kr/know/service/forestPoint/openapi/forestPoint/forestPointListSearch.do?keyValue=1270970946186349378092346977318921712436&version=1.0&localArea=11";
    var api_value = -1;

    async.waterfall([
        function(callback){
            // This function gets forest fire value from open API.
            request(url, function(err, res, html){
                if(err){
                    console.log("err");
                }
                else{
                    //console.log(html);
                    var d = new Date();
                    var regFormat_date = new RegExp("(?![(<analdate>)])[/0-9]+</analdate>",'g');
                    var regFormat_value = new RegExp("(?![(<meanavg>)])[.0-9]+</meanavg>",'g');

                    var data_date = html.match(regFormat_date);     // Find all dates
                    var data_value = html.match(regFormat_value);   // Find all forest fire values

                    var current_date_time = 24 * d.getDate() + d.getHours();
                    var nearest_index = 0, before_value = Number.MAX_SAFE_INTEGER;

                    for(var i=0;i<data_date.length;i++){
                        data_date[i] = data_date[i].replace(/<\/analdate>/g, '');
                        data_value[i] = data_value[i].replace(/<\/meanavg>/g, '');

                        var target_date_time = ((data_date[8]-'0')*10 + (data_date[9]-'0'))*24 + (data_date[11]-'0')*10 + (data_date[12]-'0');  // Calculating date to time
                        if(abs(current_date_time-target_date_time) < before_value){     // Nearest time's value
                            before_value = abs(current_date_time-target_date_time);
                            nearest_index = i;
                        }
                    }
                    api_value = data_value[nearest_index];
                    console.log("api value based at",data_date[nearest_index]);
                    //console.log(data_value[nearest_index]);

                    callback(null, api_value);
                }
            });
        }
    ],
    function(err, result){
        user_data['temp'] = req.query.temp;
        user_data['co2'] = req.query.co2;
        user_data['api_value'] = api_value;
        var content = '{ "temp": ' + user_data['temp'] + ', "co2": ' + user_data['co2'] + ', "api_value": ' + user_data['api_value'] + ' }'

        console.log(content);
        fs.writeFile('data',content,function(err){
            if(err){
                console.log('error!');
            }
        });

    });



    
// for문 안에서 connection.query를 다 수행하지 않고 아래로 진행. connection.query의 call 시간이 늦게 되는 거라 (test.js 참고) callback 함수를 아예 함수로 처리하게 함.
    //(function(user_data){mysql_connection.query("insert into data_forestFire values ('" + user_data['temperature'] + "', '" + user_data['co'] + "', '" + user_data['humidity'] + "');")})(user_data);

	 //fs.appendFile("/home/pi/Capstone_main/log.txt",JSON.stringify(user_data)+'\n',function(err){});
    res.redirect('/');
});

app.use('/static', express.static('/home/pi/work1/')); // To use directory's data in web server

app.listen(2232, function(){}); // Running web server in port 2232

