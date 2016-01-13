/**
 * fileoverview 访问css
 * author: zhenn
 */

var fs = require('fs'); 
var thunkify = require('thunkify');
var reactTools = require('react-tools');

var cwd = process.cwd();

module.exports = function *(next) {

	
		if (!this.file) {
			return;
		}
		if (this.file.type == 'jsx') {
			var content = yield thunkify(fs.readFile)( this.localPath , 'utf-8');
			content = reactTools.transform(content);
			
			this.set('Content-Type' , 'text/javascript');
			this.body = content;
		}

		yield next;
	
}


