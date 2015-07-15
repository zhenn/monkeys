/**
 * fileoverview 访问php
 * author: zhenn
 */

var path = require('path');
var fs = require('fs'); 
var thunkify = require('thunkify');
var htmlFilter = require('../core/htmlFilter');
var filetool = require('../lib/filetool');
var _process = require('child_process');

module.exports = function *(next) {
	
	// 如果是访问php时，或略src目录
		
	if (this.file) {
		if (this.file.type == 'php') {
			// 数据结构为数组
			var content = yield thunkify(_process.exec)('php ' + this.localPath);
			this.body = htmlFilter.replaceVersion(content[0] , '@@version' , 'src');
		}
	} else {

		if (path.extname(this.localPath) == '.php' && this.localPath.indexOf('/src/') == -1) {
			var cwd = process.cwd();
			var relativePath = this.localPath.replace(cwd , '');
			var itemArr = relativePath.split('/');
			itemArr.splice(2 , 0 , 'src');
			var localPath = cwd + itemArr.join('/');
			
			if(filetool.isFile(localPath)) {
				var content = yield thunkify(_process.exec)('php ' + localPath);
				this.body = htmlFilter.replaceVersion(content[0] , '@@version' , 'src');
			}
		}
	}
	

	

	yield next;
}


