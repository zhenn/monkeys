/**
 * fileoverview monkey主入口
 * author: zhenn
 */

var koa = require('koa');
var app = koa();

var checkPort = require('./lib/port');
var path = require('path');

var dir = require('./middleware/dir/');
var file = require('./middleware/file');
var html = require('./middleware/html');
var img = require('./middleware/img');
var css = require('./middleware/css');
var js = require('./middleware/js');
var php = require('./middleware/php');
var mp3 = require('./middleware/mp3');
var swf = require('./middleware/swf');
var jsx = require('./middleware/jsx');
var colors = require('colors');
var _process = require('child_process');

module.exports = function(port , cssize) {

	app.use(function *(next) {
		
		var cwd = process.cwd();
		var localPath = path.resolve(cwd , this.path.replace('/' , ''));
		this.root = cwd;
		this.localPath = localPath;
		yield next;
	});

	app.use(dir);
	app.use(file);
	app.use(html);
	app.use(php);
	app.use(css(cssize));
	app.use(js(cssize));
	app.use(jsx);
	app.use(img);
	app.use(mp3);
	app.use(swf);

	_process.exec('ls', function (error, stdout, stderr) {
		if (error) {
			console.log(error);
			return;
		}
		
		if (stdout.indexOf('node_module') <= -1) {
			console.log('正在安装ES6规则集, 请稍后...'.red);
			_process.exec('cd ' + process.cwd() + ' && sudo npm install --save-dev babel-preset-es2015', function(err, _stdout, _stderr) {
				startServer();
			});
			return;
		}

		startServer();
	});
	

	function startServer() {
		checkPort(port , '127.0.0.1' , function (status) {
			if (status == 'closed') {
				app.listen(port);
				console.log('您已成功本地server:'.green);
				console.log(('	1. 根目录为：' + process.cwd()).green);
				console.log(('	2. 端口：' + port).green);
			} else {
				console.log(('端口:' + port + '已被占用或链接超时\n').underline.red);
			}
		});
	}

	
}


