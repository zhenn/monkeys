/**
 * fileoverview 访问js
 * author: zhenn
 */

var fs = require('fs'); 
var thunkify = require('thunkify');
var inlineTmpl = require('../core/inlineTmpl');

module.exports = function *(next) {
	var self = this ,content;
	if (!this.file) {
		return;
	}
	
	if (this.file.type == 'js') {
		this.set('Content-Type' , 'application/x-javascript; charset=utf-8');
		
		// 若是seed.js 
		// 需要人工处理require
		if (this.path.match(/seed\.js$/gi)) {
			var source = yield thunkify(fs.readFile)( this.localPath , 'utf-8');
			var moduleIds = source.match(/\'.+?\'/gi).map(function (val) {
				return  self.localPath.replace(/seed\.js$/gi , '') + val.replace(/\'/gi ,'') + '.js';
			})
			var contents = [];

			moduleIds.forEach(function (v , index) {
				contents.push(fs.readFileSync( v , 'utf-8'));
			});
			content = contents.join('');

		} else {
			content = yield thunkify(fs.readFile)( this.localPath , 'utf-8');
			content = inlineTmpl._replace(content , this.localPath);
		}

		this.body = content;
	}

	yield next;
}
	

