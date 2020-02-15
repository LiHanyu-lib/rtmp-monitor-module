// var express = require("express");
// var session = require('express-session');
var request = require('request');
// var bodyParser = require('body-parser');
var parseString = require('xml2js').parseString;
var config = require('./config.json');
// var language = require('./language/'+config.language+'.json');
// var app = express();
// app.use(express.static('public'));
// app.use(bodyParser.urlencoded({extended: false}));
// var server = app.listen(config.http_server_port);
// var server = require('http').createServer(app);
var server = require('http').createServer();
// var io = require('socket.io').listen(server);
var io = require('socket.io').listen(config.http_server_port);
var os = require("os");

function cpuAverage() {
    var totalIdle = 0, totalTick = 0;
    var cpus = os.cpus();
    for(var i = 0, len = cpus.length; i < len; i++) {
        var cpu = cpus[i];
        for(type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    }
    return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
}
var startMeasure = cpuAverage();


setInterval(function(){

    setTimeout(function() {
        var endMeasure = cpuAverage();
        var idleDifference = endMeasure.idle - startMeasure.idle;
        var totalDifference = endMeasure.total - startMeasure.total;
        var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        var spawn = require('child_process').spawn;
        var prc = spawn('free',  []);
        var used_memory = 0;
        prc.stdout.setEncoding('utf8');
        prc.stdout.on('data', function (data) {
            var str = data.toString();
            var lines = str.split(/\n/g);
            for(var i = 0; i < lines.length; i++) {
                lines[i] = lines[i].split(/\s+/);
            }
            used_memory = lines[1][2];
            console.log('used_CPU=' + percentageCPU + '  used_memory=' + used_memory);
            io.emit('server', {
                used_cpu:percentageCPU,
                used_memory:used_memory
            });
        });
    }, 100);

    request.get(config.rtmp_server_url,{timeout:config.rtmp_server_timeout},function(error, meta, xml){

    console.log('------------------------')
    // console.log(xml)

    if(error) {
        io.emit('error', {"error":true});
    }

    parseString(xml,function (err, result) {

        console.log(result)

    	if(err != null)
    	{
    		io.emit('error', {"error":true});
    	}else{
    		io.emit('error', {"error":false});
    	}

        if(err != null)
        {
            io.emit('statistics', result);
        }else{
            io.emit('statistics', result.rtmp);
        }

    });

  });

},config.rtmp_server_refresh);