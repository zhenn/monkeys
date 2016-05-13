/**
 * @fileoverview 分析js模块依赖树
 * @author zhenn
 * @time 2015-07-18
 * @email zhennlife@vip.qq.com
 */

var _ = require('../lib/underscore');
var fs = require('fs');
var path = require('path');
var inlineTmpl = require('./inlineTmpl');
var reactTools = require('react-tools');
var babel = require('babel-core');

module.exports = {
	/**
	 * 给对象组成的数组去重
	 * @param arr {array} 需去重的数组
	 * @return 新数组
	 */
	unique : function (arr) {
		var self = this;
		var result = [];
		arr.reverse();

		for (var i = 0 , len = arr.length; i < len; i++) {
			if (self.hasObjectInArray(result , arr[i])) {
				continue;
			}
			result.push(arr[i]);
		}
		
		return result;
	},

	/**
	 * 判断数组中是否已存在某对象
	 * @param arr {array} 待检测数组
	 * @param obj {object} 检测的对象
	 * @return boolean
	 */
	hasObjectInArray : function (arr , obj) {
		var result;
		for (var i = arr.length; i--;) {
			if (_.isEqual(arr[i] , obj)) {
				result = 1;
				break;
			}
		}
		return result;
	},

	/**
	 * 获取依赖数(通用于IO编译及打包阶段)
	 * @param projectParentDirName {string} 项目目录的父级目录
	 * @param absolutePath {string} 需要分析的模块文件路径
	 * @return 数组，用来描述整个依赖关系
	 * 	如：'./deps.json'
	 */
	getDepsTree : function (projectParentDirName , absolutePath) {
		var self = this;
		var requireReg = /require\(['"](.+?)['"]\)/gi;
		var depModules = [];

		var realProjectName = absolutePath.replace(projectParentDirName , '').split('/')[1];

		// _path 绝对路径
		function depWalker (_path) {
			
			var dirname = path.dirname(_path);
			var basename = path.basename(_path);
			var fileSource = fs.readFileSync(_path , 'utf-8');
			var requireList = fileSource.match(requireReg) && fileSource.match(requireReg).map(function (v , index) {

				return v.replace(requireReg , function ($1 , $2) {

					return $2;
				});
			});
			if (requireList == null) {
				requireList = [];
			}
			
			var modulePreReg = /^.+js\//gi;
			var curProjectName = _path.replace(projectParentDirName , '').split('/')[1];
			
			var moduleName = _path.replace(projectParentDirName , '').replace(modulePreReg , '');
			if (curProjectName != realProjectName) {
				moduleName = curProjectName + '/' + moduleName;
			}	

			depModules.push({
				name : moduleName.replace(/\.js$/ , ''),
				src : _path,
				require : [].concat(requireList)
			});

			requireList && requireList.forEach(function (v , index) {
				var innerAbsolutePath;

				// 若是本项目引用方式 ，如'./xx' '../xxx'
				if (v[0] == '.') {

					if (v.match(/\.jsx$/i)) {
						innerAbsolutePath = path.resolve(dirname ,v);
					} else {
						innerAbsolutePath = path.resolve(dirname ,v) + '.js';
					}
					
				} else {
					// 
					var depName = v.split('/')[0];
					if (v.match(/\.jsx$/i)) {
						innerAbsolutePath = path.resolve(projectParentDirName , v.replace(depName , depName + '/src/js'));

					} else {
						innerAbsolutePath = path.resolve(projectParentDirName , v.replace(depName , depName + '/src/js')) + '.js';
					}
				}

				depWalker(innerAbsolutePath);
			});
			
			
		}

		depWalker(absolutePath);
		
		return self.unique(depModules);
	},

	/**
	 * 输出指定路径的js模块内容，经requirejs格式修正
	 * @param
	 * @return 
	 */
	export : function (projectParentDirName , absolutePath) {
		var self = this;
		var deps = self.getDepsTree(projectParentDirName , absolutePath);
		var result = []
		deps.forEach(function (v , index) {
			var filepath = v.src;
			var name = v.name;
			var requires = v.require;

			var content = fs.readFileSync(filepath , 'utf-8');
			try {
				content = reactTools.transform(content);
				content = babel.transform(content, {
					presets: ['es2015']
				}).code;
				content = content.replace('"use strict";', '');
			} catch (e) {
				console.log(e.message);
			}
			content = inlineTmpl._replace(content , filepath);

			result.push(self.attach(content , name , requires));
		});

		return result.join('\n');
	},

	/**
	 * 为js模块增加requirejs的源格式
	 * @param content {string} js模块的源代码
	 * @returm 修正的内容
	 */
	attach : function (content , name , requires) {
		
		var isAmdModule;
		var result;
		var amdReg = /define\s*?(\(\s*?)function/gi;

		// 如果是amd模块
		if (content.match(amdReg)) {
			result = content.replace(amdReg , function ($1 , $2) {
				var pre = ['require' , 'exports' , 'module'];
				var _require = pre.concat(requires).map(function (v , index) {
					// v = v.replace(/\.jsx$/i , 'jsx');
					return '"' + v + '"';
				});;
				// name = name.replace('.' , '');
				return 'define' + $2 + '"' + name + '" , [' + _require.join(',') + '] , function';
			});
		} else {

			// 否则是普通js文件
			result = content + ';\n' + 'define("' + name + '",function(){});'; 
		}	

		return result;
	}
};



			
