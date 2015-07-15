/**
 * fileoverview 文件夹访问
 * author: zhenn
 */

var path = require('path');
var fs = require('fs'); 
var _ = require('../../lib/underscore');
var thunkify = require('thunkify');
var filetool = require('../../lib/filetool');

module.exports = function *(next) {
	var localPath = this.localPath,
		isdir = filetool.isDir(localPath),
		data,
		temp;
	
	if (isdir) {
		data = filetool.getContains(localPath);

		temp = yield thunkify(fs.readFile)( __dirname + '/index.html' , 'utf-8');
		this.body = _.template(temp)(data);
		
	}
	yield next;

}





