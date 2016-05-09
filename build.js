/**
 * @fileoverview monkey打包入口
 * @author: zhenn
 * @time 2015-04-23
 */


// 打包flow：

// 1，检测依赖项目的版本号是否和本地仓库中一致，若不一致，则退出打包流程
// 2，检测当前分支号是否符合既定规则，若否，直接退出打包流程
//      - stage打包在daily分支
//      - product打包在master分支
// 3，若build存在，则先删除
// 4，分别打包html、css、js、image文件到build对应目录
// 5，打包完成，在控制台做通知

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
var jsdeps = require('./core/jsdeps');

var uglifycss = require('uglifycss');
var minifyJs = require('./core/minifyJs');

// 让json支持注释
require('json-comments');


// 执行build的目录
var cwd = process.cwd();
var monkeysMeta = require('./meta.json');
var cdnHost = {
	local : monkeysMeta.cdn.local,
	product : monkeysMeta.cdn.product
};
var cdnReg = new RegExp('http://' + cdnHost.local , 'gi');



module.exports = {

	/**
	 * build入口
	 */
	main : function (envObj) {
		var self = this;
		self.envObj = envObj;

		// 检测依赖项目的版本号是否和本地仓库中一致，若不一致，则退出打包流程
		var depVersionSame = self.checkDepsVersion();
		if (depVersionSame !== true) {
			console.log(depVersionSame.red);
			return;
		}
		console.log('依赖项目版本号和本地仓库中版本完全一致，可正常打包'.green);

		step(
			// 检测当前分支号是否符合既定规则，若否，直接退出打包流程
			//      - stage打包在daily分支
			//      - product打包在master分支
			function () {
				// var repo = new Repo(cwd);
				// repo.currentBranch(this);
				return 1;
			},

			function (err , branch) {
				
				if (err) {
					throw err;
				}

				return 1;
				
				// if (branch.indexOf('daily') > -1) {

				// 	if (envObj.stage) {
				// 		console.log('当前分支可进行打包操作'.green);
				// 		return 1;
				// 	} else {
				// 		console.log('notification:\n'.red + '	- stage打包只能在daily/x.x.x上进行,请切换分支'.gray);
				// 	}
				// }
				// if (branch == 'master') {
				// 	if (envObj.product) {
				// 		console.log('当前分支可进行打包操作'.green);
				// 		return 1;
				// 	} else {
				// 		console.log('notification:\n'.red + '	- product打包只能在master上进行,请切换分支'.gray);
				// 	}
				// }
			},

			function (err) {
				if (err) {
					throw err;
				}
				
				if (filetool.isDir(cwd + '/build')) {
					filetool.rmdir(cwd + '/build' , this);
				} else {
					return 1;
				}
			},

			function (err) {
				if (err) {
					throw err;
				}

	        	filetool.copydir(cwd+ '/src/' , cwd + '/build'); 
				return 1;
			},

			function compileJS (err) {
				if (err) {
					throw err;
				}
				self.compileJS();
				return 1
			},

			function compileHTML (err) {
				if (err) {
					throw err;
				}

				self.compileHTML();
				return 1;
			},

			function compileCss (err) {
				if (err) {
					throw err;
				}

				self.compileCss();
				return 1;
			},

			function addExegesis (err) {
				if (err) {
					throw err;
				}
				self.addExegesis();
				return 1;
			},

			function minifyImages (err) {
				if (err) {
					throw err;
				}
				try {
					var imagemin = new ImageMin();
					console.log('正在压缩图片,稍后...'.green);
				    imagemin.src(cwd + '/src/images/*.{gif,jpg,png,svg}')
				    		.dest(cwd + '/build/images');
				    imagemin.run(this);
				} catch(e) {
					console.log(e.message);
					console.log('done!!!!!'.red);
				}
				
			},

			function notify (err , files) {
	    		if (err) {
	    			throw err;
	    		}
	    		console.log('--------------------------\nimageMinified:'.green);
    			files.forEach(function (v , index) {
    				var paths = path.basename(v.path);
    				console.log(('    ' + cwd + '/src/images/' + paths + '  ===>  ' + cwd + '/build/images/' + paths).gray);
    			});
    			console.log('构建完毕..........'.green);
	    		return 1;
			}

		);

	},

	// 在js、css中增加时间戳作为注释
	addExegesis : function () {
		if (filetool.isDir(cwd + '/build/css')) {
			var cssFiles = filetool.walker(cwd + '/build/css');
			cssFiles.forEach(function (v , i) {
				var ext = path.extname(v);
				var invalidArr = ['.js' , '.css' , '.jsx' , '.tmpl'];

				if (invalidArr.indexOf(ext) < 0) {
					return;
				}
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

	/** 
	 * 编译html文件
	 * @param void
	 */
	compileHTML : function () {
		var self = this;
		var htmlDir = cwd + '/build';	  
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

	/**
	 * 对于css文件进行静态编译
	 * @param void
	 * @return void
	 */
	compileCss : function () {

		var self = this;
		var cssDir = cwd + '/build/css';
		var ids = filetool.walker(cssDir);
		var cssize = self.envObj.cssize;
		var metaJSON = require(cwd + '/meta.json');
		var targetHost = '';

		if (self.envObj.product) {
			targetHost = 'http://' + cdnHost.product;
		}
		console.log('正在进行css文件静态编译:');
		ids.forEach(function (v , index) {
			var ext = path.extname(v);
			var content = '';
			if (ext != '.css') {
				return;
			}

			var temp = cwd.split('/');
			temp.pop();
			content = cssFilter.importsWalker(v , temp.join('/'));
			content = cssFilter.replaceVersion(content , '@@version' , metaJSON.version);
			content = cssFilter.changeDomain(content , 'http://' + cdnHost.local , targetHost);

			content = cssFilter.changePxToRem(content , cssize);
			var uglified = uglifycss.processString(content);

			fs.writeFileSync(v , uglified , 'utf-8');
			console.log(('    ' + v.replace(/\/build\//g , '/src/') + ' ===> ' + v + ' 100%').gray);
		});
	},

	/**
	 * 对于js文件进行静态编译
	 * @param void
	 * @return void
	 */
	compileJS : function () {
		var self = this;
		var jsDir = cwd + '/src/js';
		var ids = filetool.walker(jsDir);
		var metaJSON = require(cwd + '/meta.json');
		var seedJsList = metaJSON.seedJsList;
		var cssize = self.envObj.cssize;
		var _arr = cwd.split('/');
		_arr.pop();
		var projectParentDirName = _arr.join('/');

		var targetHost = '';

		if (self.envObj.product) {
			targetHost = 'http://' + cdnHost.product;
		}
		
		console.log('正在进行js文件静态编译:');

		ids.forEach(function (val ,i) {
			var extname = path.extname(val),
				basename = path.basename(val),
				content;

			if (extname != '.js' && extname != '.jsx') {
				return;
			}

			if (seedJsList && seedJsList.indexOf(basename) > -1) {
				self.seedTypeJSHandler(val);
				return;
			}

			if (metaJSON.build && metaJSON.build.amdJsCombine) {
				content = jsdeps.export(projectParentDirName , val);
			} else {
				content = fs.readFileSync(val , 'utf-8');
			}
			content = cssFilter.changePxToRem(content , cssize);
			content = cssFilter.replaceVersion(content , '@@version' , metaJSON.version);
			content = cssFilter.changeDomain(content , 'http://' + cdnHost.local , targetHost);

			if (metaJSON.build && metaJSON.build.jsmin) {
				content = minifyJs(content);
			}
			
			fs.writeFileSync(val.replace('/src/' , '/build/') , content , 'utf-8');
			
			console.log(('    ' + val + ' ===> ' + val.replace(/\/src\//g , '/build/') + ' 100%').gray);
		});
	},

	/**
	 * 处理seed类型的js模块——特点：只包含require(xxx)，无需递归处理
	 * @param _path {string} js文件的绝对路径
	 * @return void
	 */
	seedTypeJSHandler : function (_path) {
		console.log(_path)
		var self = this;
		var fileContent = fs.readFileSync(_path , 'utf-8');
		
		var depsReg = /'(.+?)'/gi;
		var depsModList = fileContent.match(depsReg).map(function (v , i) {
			return path.resolve(path.dirname(_path) , v.replace(/'/gi , '') + '.js');
		});
		var buffer = '';
		var amdReg = /,define\(.*\)/gi;
		depsModList.forEach(function (val , i) {
			var temp = minifyJs(fs.readFileSync(val , 'utf-8'));
			temp = temp.replace(amdReg , '');
			buffer += temp;
		});
		
		fs.writeFileSync(_path.replace('/src/' , '/build/') , buffer , 'utf-8');
	},

	/**
	 * 判断项目依赖的版本号是否和本地仓库版本号一致
	 * @param void
	 * @Return boolean || string
	 */
	checkDepsVersion : function () {
		var self = this;
		var curMeta = require(cwd + '/meta.json');
		var deps = curMeta.deps;

		for (var i in deps) {
			var dep = deps[i];
			var depProjectDir = path.resolve(cwd , dep.split(':')[0]);
			var depProjectNeedVersion = dep.split(':')[1];

			var depProjectMeta = require(depProjectDir + '/meta.json');
			
			if (depProjectMeta.version != depProjectNeedVersion) {
				return '依赖项目: ' + depProjectMeta.name + '版本号不符,请确认本地仓库中版本号';
			}
		}
		return true;
	}

	
}












