/**
 * @fileoverview monkey打包入口
 * @author: zhenn
 * @time 2015-04-23
 */
var _process = require('child_process');
var filetool = require('./lib/filetool');
var step = require('step');
var fs = require('fs');
var inlineTmpl = require('./core/inlineTmpl');
var path = require('path');
var htmlFilter = require('./core/htmlFilter');
var colors = require('colors');
var Repo = require('git-tools');
var ImageMin = require('imagemin');
var time = require('./lib/time');
var cssFilter = require('./core/cssFilter');


// 执行build的目录
var cwd = process.cwd();
var cdnHost = {
	local : 'local.cdn.pengpengla.com',
	product : 'p1.cdn.pengpengla.com'
};
var cdnReg = new RegExp('http://' + cdnHost.local , 'gi');

module.exports = {

	/**
	 * build入口
	 */
	main : function (envObj) {
		var self = this;
		self.envObj = envObj;
		var depVersionSame = self.checkDepsVersion();
		if (depVersionSame !== true) {
			console.log(depVersionSame.red);
			return;
		}
		console.log('依赖项目版本号和本地仓库中版本完全一致，可正常打包'.green);

		var repo = new Repo(cwd);

		step(
			function getCurBranch () {
				repo.currentBranch(this);
			},

			function isViable (err , branch) {
				if (err) throw err;
				
			    if (branch.indexOf('daily') > -1) {
			    	if (envObj.stage) {
			    		return 1;
			    	} else {
			    		console.log('notification:\n'.red + '	- stage打包只能在daily/x.x.x上进行,请切换分支'.gray);
			    	}
			    }
			    if (branch == 'master') {
			    	if (envObj.product) {
			    		return 1;
			    	} else {
			    		console.log('notification:\n'.red + '	- product打包只能在master上进行,请切换分支'.gray);
			    	}
			    }
				
			},

			// 拷贝src到temp目录
			// 预处理以下操作:
			// 1,js模块中的__inline
			function cpSrcToTemp (err) {
				if (err) throw err;
	        	filetool.copydir(cwd+ '/src/' , cwd + '/temp'); 
				return 1;
			},
			// 在temp中遍历js模块替换__inline
			function compileJS (err) {
				if (err) throw err;
				self.compileJS();
				return 1
			},
			// 编译html文件
			function compileHTML (err) {
				if (err) {
					throw err;
				}

				self.compileHTML();
				return 1;
			},
			// 
			function compileCss (err) {
				if (err) {
					throw err;
				}

				self.compileCss();
				return 1;
			},

			function removeBuild(err) {
				if (err) throw err;
				// 如果build目录存在,先删除
				if (filetool.isDir(cwd + '/build')) {
					filetool.rmdir(cwd + '/build' , this);
				} else {
					return 1;
				}
			},
			function execRequireJSBuild (err , dirs , files) {
				if (err) throw err;
				_process.exec('cd ' + cwd + ' && r.js -o config.js', this).stdout
				.on('data' , function (result) {
					console.log(result);
				});
			},
			// 从temp中拷贝html文件到build目录
			function copyHtmlFormTempToBuild (err) {
				if (err) throw err;
				self.copyHtmlFormTempToBuild();
				return 1;
			},

			function generateBuildDir (err) {
				if (err) {
					throw err;
				} 
	        	// 正常执行完毕
	  			// 拷贝.dist目录至于build目录并删除.dist
	        	filetool.copydir(cwd+ '/.dist/temp/' , cwd + '/build'); 
				filetool.rmdir(cwd + '/temp' , function () {});
	        	filetool.rmdir(cwd + '/.dist' , this);
			},

			// 压缩图片
			function minifyImages (err) {
				if (err) throw err;
				var imagemin = new ImageMin();
				console.log('正在压缩图片,稍后...'.green);
			    imagemin.src(cwd + '/src/images/*.{gif,jpg,png,svg}')
			    		.dest(cwd + '/build/images');


			    imagemin.run(this);
			},
			
			function notify (err , files) {
	    		if (err) {
	    			throw err;
	    		}
	    		console.log('--------------------------\nimageMinified:'.green);
    			files.forEach(function (v , index) {
    				var paths = path.basename(v.path);
    				console.log((cwd + '/src/images/' + paths + '  ===>  ' + cwd + '/build/images/' + paths).gray);
    			});
	    		console.log('已删除临时文件夹:' + cwd + '/.dist');
	    		console.log('已删除临时文件夹:' + cwd + '/temp');

	    		return 1;
			},

			// 在js、css中增加时间戳作为注释
			function addExegesis (err) {
				if (err) throw err;
				self.addExegesis();
			}
		);

	},

	// 在js、css中增加时间戳作为注释
	addExegesis : function () {
		if (filetool.isDir(cwd + '/build/css')) {
			var cssFiles = filetool.walker(cwd + '/build/css');
			cssFiles.forEach(function (v , i) {
				var content = fs.readFileSync(v , 'utf-8');
				fs.writeFileSync(v , '/****built in ' + time.format(new Date) + '****/\n' + content , 'utf-8');
			});
		}

		var jsFiles = filetool.walker(cwd + '/build/js');
		jsFiles.forEach(function (v , i) {
			if (path.extname(v) != '.js') {
				return;
			}
			var content = fs.readFileSync(v , 'utf-8');
			fs.writeFileSync(v , '/****built in ' + time.format(new Date) + '****/\n' + content , 'utf-8');
		});
	},

	compileHTML : function () {
		var self = this;
		var htmlDir = cwd + '/temp';	  
		var files = filetool.walker(htmlDir);
		
		
		var metaJSON = require(cwd + '/meta.json');

		files.forEach(function (val , i) {
			var extname = path.extname(val),
				content;

			if (extname != '.html' && extname != '.php') return;

			content = fs.readFileSync(val , 'utf-8');
			content = htmlFilter.replaceVersion(content , '@@version' , metaJSON.version);
			// 若打包环境是stage
			// 则去掉页面中所有cdn域名,"p1.cdn.pengpengla.com"
			if (self.envObj.stage) {
				content = content.replace(cdnReg , '');
			} else if (self.envObj.product) {
				content = content.replace(cdnReg , 'http://' + cdnHost.product);
			}
			fs.writeFileSync(val , content , 'utf-8');
		});
	},

	compileCss : function () {
		var self = this;
		var cssDir = cwd + '/temp/css';
		var ids = filetool.walker(cssDir);
		var cssize = self.envObj.cssize;
		
		ids.forEach(function (v , index) {
			var ext = path.extname(v);
			var content = '';
			if (ext != '.css') {
				return;
			}

			var temp = cwd.split('/');
			temp.pop();
			content = cssFilter.importsWalker(v , temp.join('/'));

			content = cssFilter.changePxToRem(content , cssize);
			fs.writeFileSync(v , content , 'utf-8');
		});
	},

	// 对于js模块再次编译
	compileJS : function () {
		var self = this;
		var jsDir = cwd + '/temp/js';
		var ids = filetool.walker(jsDir);
		var metaJSON = require(cwd + '/meta.json');
		var seedJsList = metaJSON.seedJsList;

		ids.forEach(function (val ,i) {
			var extname = path.extname(val),
				basename = path.basename(val),
				content;

			if (extname != '.js') {
				return;
			}

			if (seedJsList && seedJsList.indexOf(basename) > -1) {
				self.seedTypeJSHandler(val);
				return;
			}

			content = fs.readFileSync( val , 'utf-8');
			content = inlineTmpl._replace(content , val);

			//console.log(content.indexOf('__inline'))
			fs.writeFileSync(val , content , 'utf-8');
		});
		
			
	},

	// 处理seed类型的js模块
	// 特点：只包含require(xxx)，无需递归处理
	seedTypeJSHandler : function (_path) {
		var self = this;
		var fileContent = fs.readFileSync(_path , 'utf-8');
		console.log(fileContent)
		var depsReg = /'(.+?)'/gi;
		var depsModList = fileContent.match(depsReg).map(function (v , i) {
			return path.resolve(path.dirname(_path) , v.replace(/'/gi , '') + '.js');
		});
		var buffer = '';
		depsModList.forEach(function (val , i) {
			buffer += fs.readFileSync(val , 'utf-8');
		});
		fs.writeFileSync(_path , buffer , 'utf-8');
	},

	// 从temp文件夹拷贝html文件到build目录
	copyHtmlFormTempToBuild : function () {
		var htmlDir = cwd + '/temp'	;
		var htmlpaths = filetool.walker(htmlDir);
		htmlpaths.forEach(function (v , index) {
			var ext = path.extname(v);
			if (ext != '.html') return;
			filetool.copyfile(v , v.replace(/\/temp\// , '/build/'));
		});
	},

	// 判断项目依赖的版本号是否和本地仓库版本号一致
	checkDepsVersion : function () {
		var self = this;
		var curMeta = require(cwd + '/meta.json');
		var deps = curMeta.deps;
		for (var i in deps) {
			var dep = deps[i];
			var depProjectDir = path.resolve(cwd , dep.split(':')[0]);
			var depProjectNeedVersion = dep.split(':')[1];
			var depProjectMeta = require(depProjectDir + '/meta.json');
			//console.log(depProjectMeta);
			if (depProjectMeta.version != depProjectNeedVersion) {
				return '依赖项目: ' + depProjectMeta.name + '版本号不符,请确认本地仓库中版本号';
			}
		}
		return true;
	}

	
}












