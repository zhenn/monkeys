/**
 * @fileoverview js模块对__inline语法糖万相关编译
 * @author zhenn
 * @time 2015-04-23
 */

var _ = require('../lib/underscore');
var fs = require('fs');
var path = require('path');
var uglify = require('uglify-js');

var inlineReg = /__inline\([\'\"].+?[\'\"]\)/gi;
module.exports = {
	
	/** 
	 * 编译js模块中的__inline
	 * @param source {string} js模块源文件内容
	 * @param curFilePath {string} js模块文件的路径
	 * @return string 编译后的内容
	 */
	_replace : function (source , curFilePath) {
		this.curFilePath = curFilePath;
		var self = this,
			inlineIds = this.findInlineIds(source),
			result;
		// 不包含__inline,直接返回
		if (!inlineIds) {
			return source;
		}
		inlineIds.forEach(function (val ,i) {
			var content = self.getContent(val);
			// 增加'var a='为了通过uglify校验
			// 否则无法通过function(){}无法通过
			var compliedContent = 'var a=' + self.compile(content);
			var compliedMinify = uglify.minify(compliedContent , {
				fromString : true
			}).code.replace(/(var a=)|(;$)/gi,'');

			source = source.replace("__inline('" + val + "')" , compliedMinify).replace("__inline(\"" + val + "\")" , compliedMinify);
		});

		return source;
	},

	/**
	 * 从内容中查找inline的路径
	 * @param source {string} 
	 * @return array
	 */
	findInlineIds : function (source) {
		if (typeof source == 'undefined') {
			return;
		}
		
		var ids = source.match(inlineReg);
		
		if (!ids) {
			return;
		}
		ids = ids.map(function (v ,i) {
			return v.replace(/(__inline\([\'\"])|([\'\"]\))/gi ,'')
		});
		return ids;
	},

	/**
	 * 根据相对路径获取模块原内容
	 * @param relativePath {string}  './xx.tmpl'
	 * @return string
	 */
	getContent : function (relativePath) {
		var arr = this.curFilePath.split('/'),
			curDirPath,
			absolutePath;
		arr.pop();
		curDirPath = arr.join('/');
		absolutePath = path.resolve(curDirPath , relativePath);

		return fs.readFileSync(absolutePath , 'utf-8');
	},

	/**
	 * 使用underscore编译模板
	 * @param content {string} 
	 * @return funciton
	 */
	compile : function (content) {
		var source = _.template(content).source;
		//console.log(source);
		return source.replace(/;$/gi ,'');
	}
};



