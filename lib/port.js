/**
 * 检测端口是否被占用
 * (利用建立socket链接的方式检测)
 */ 

var net = require('net');
var socket = net.Socket;

module.exports = function (port , host , cb) {
	var nsk = new socket();


    nsk.setTimeout(5000);//设置连接超时时间  5s
    nsk.on('connect',function(){//连接状态
        nsk.destroy();//销毁
        cb('open');
    })
    .on('timeout',function(){//连接超时
        nsk.destroy();
        cb('timeout');
    })
    .on('error',function(){//连接错误
        nsk.destroy();
        cb('closed');
    });

    nsk.connect(port,host);//执行连接
};