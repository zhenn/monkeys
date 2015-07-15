/**
 * fileoverview 访问css
 * author: zhenn
 */

var fs = require('fs'); 
var thunkify = require('thunkify');
var cssFilter = require('../core/cssFilter');

module.exports = function (cssize) {

	return function *(next) {
		if (!this.file) {
			return;
		}
		if (this.file.type == 'css') {
			var content = yield thunkify(fs.readFile)( this.localPath , 'utf-8');
			
			this.set('Content-Type' , 'text/css');
			this.body = cssFilter.changePxToRem(content , cssize);
		}

		yield next;
	}
}


