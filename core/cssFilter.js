/**
 * @fileoverview css文件过滤
 * @author zhenn
 */

var fs = require('fs');
var path = require('path');
var base = require('./base');
var extend = require('extend');

module.exports = extend({

	/**
	 * 转换px到rem
	 * @param size {number} 设计稿的宽度
	 * @param content {start} css内容
	 */
	changePxToRem : function (content , size) {
		var sizeReg = /(\d+)px([; ',"])/gi;
		if (!size) {
			return content;
		}
		
		content = content.replace(sizeReg , function ($1 , $2 , $3, index , source) {
			return ($2 * 2) / (size / 10) + 'rem' + $3; 
		});

		return content;
	},

	/**
	 * 解析css文件中的import引用
	 * @param cssPath {string} css文件绝对路径
	 * @return 
	 */
	importsWalker : function (cssPath , projectPath) {
		var self = this;
		var importReg = /@import\s+url\((.+?)\);/gi;
		var cssCodeArr = [];

		function walk (p) {
			var source = fs.readFileSync(p , 'utf-8');
			var importList = source.match(importReg);

			if (importList) {
				importList.forEach(function (v , index) {
					var _path = v.replace(importReg , function ($1 , $2) {
						return $2;
					});
					var absolutePath;
					var pathEls = _path.split('/');
					pathEls.splice(1 , 0 , 'src');

					// 本项目中引用
					if (_path[0] == '.') {
						absolutePath = path.resolve(path.dirname(p) , _path);
					} else {
						// 跨项目引用
						var crossPath = pathEls.splic
						absolutePath = projectPath + '/' + pathEls.join('/');
					}
					
					walk(absolutePath);
				});
			}

			cssCodeArr.push(source.replace(importReg , ''));
			
		}
		walk(cssPath);
		
		return cssCodeArr.join('\n');
	}

} , base);



