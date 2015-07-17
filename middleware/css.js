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
			
			var content = cssFilter.importsWalker(this.localPath , cwd);
			content = cssFilter.replaceVersion(content , '@@version' , 'src');
			
			this.set('Content-Type' , 'text/css');
			this.body = cssFilter.changePxToRem(content , cssize);
		}

		yield next;
	}
}


