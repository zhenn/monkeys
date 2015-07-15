
var path = require('path');
var fs = require('fs'); 
var _ = require('../lib/underscore');
var thunkify = require('thunkify');
var filetool = require('../lib/filetool');
var colors = require('colors');
var prompt = require('prompt');
var _process = require('child_process');
var step = require('step');

module.exports = {
	main : function () {
		var self = this;
		self.cwd = process.cwd();
		self.tempDir = __dirname + '/temp';
		
		if (self.isEmpty()) {
			self.create();

		} else {
			console.log('当前目录为非空目录...操作已中断'.red);
		}

	},

	// check current dir is empty or not
	isEmpty : function () {
		var self = this;
		var contains = filetool.getContains(self.cwd);
		return !contains.list.length
	},

	// get basic message for project
	getBaseMsg : function (cb) {
		var self = this;
		var schema = {
			properties: {
				name : {
					description : '项目名称',
					default : path.basename(self.cwd)
				},
				version: {
					description : '项目版本',
					pattern: /^\d+?\.\d+?\.\d+?$/,
					message: 'pattern: 1.0.0',
					required: true
				},

				remoteRepo : {
					description : '远程仓库地址',
					default : 'git@gitlab.pengpeng.la:html5/' + path.basename(self.cwd) + '.git'
				}
			}
		};

		prompt.start();
		prompt.get(schema , cb);
	},

	// create the basic structure for project
	create : function () {
		var self = this;
		self.getBaseMsg(function (err , result) {
			self.createMeta(result);
			filetool.copyfile(self.tempDir + '/config.js' , self.cwd + '/config.js');
			filetool.copyfile(self.tempDir + '/.gitignore' , self.cwd + '/.gitignore');
			filetool.copydir(self.tempDir + '/src' , self.cwd + '/src');
			self.compileHTML(result);
			console.log('log:'.green + (' project ' + result.name + ' has created').gray);

			self.makeGitInit(result);
		});
		
	},

	// create meta.json
	createMeta : function (obj) {
		var self = this;
		var metaJSON = _.template(fs.readFileSync(self.tempDir + '/meta.json' , 'utf-8'))(obj);
		fs.writeFileSync(self.cwd + '/meta.json' , metaJSON , 'utf-8');
	},

	// Do some compilation work, ensure that the HTML working
	compileHTML : function (obj) {
		var self = this;
		var htmlPath = self.cwd + '/src/index.html';
		var html = fs.readFileSync( htmlPath, 'utf-8');
		var result = _.template(html)(obj);
		fs.writeFileSync(htmlPath , result , 'utf-8');
	},

	// initializes the git repository
	makeGitInit : function (result) {
		var version = result.version;

		step(
			function gitInit () {
				_process.exec('git init' , this);
			},

			function gitAdd (err , err1 , stdout , stderr) {
				if (err) {
					throw err;
				}
				_process.exec('git add .' , this);
			},

			function gitCommit (err , err1 , stdout , stderr) {
				if (err) {
					throw err;
				}
				_process.exec('git commit -am "first ci"' , this);
			},

			function addRemoteRepo (err , err1 , stdout , stderr) {
				if (err) throw err;
				_process.exec('git remote add origin ' + result.remoteRepo , this);
			},

			function sendToRemote (err , err1 , stdout , stderr) {
				if (err) {
					throw err;
				}
				_process.exec('git push origin master' , this);
			},

			function checkoutNewBranch(err , err1 , stdout , stderr) {
				if (err) {
					throw err;
				}
				console.log(stdout.green);
				_process.exec('git checkout -b daily/' + version , this);
			},

			function (err) {
				if (err) throw err;
				console.log('Besides:'.red);
				console.log('	- 当前git分支已创建并切换到项目分支'.gray);
				console.log('	- 开始你的编程之旅吧'.gray);
			}

		);
		
	}


};