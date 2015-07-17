/**
 * fileoverview 访问css
 * author: zhenn
 */

var fs = require('fs'); 
var thunkify = require('thunkify');
var cssFilter = require('../core/cssFilter');

var cwd = process.cwd();

module.exports = function (cssize) {

	return function *(next) {
		if (!this.file) {
			return;
		}
		if (this.file.type == 'css') {
			// var projectPath = cwd + '/' + this.localPath.replace(cwd , '').split('/')[1];
			var content = cssFilter.importsWalker(this.localPath , cwd);
			
			this.set('Content-Type' , 'text/css');
			this.body = cssFilter.changePxToRem(content , cssize);
		}

		yield next;
	}
}


