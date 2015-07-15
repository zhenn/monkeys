/**
 * fileoverview 访问文件(预处理),增加文件类型标示
 * author: zhenn
 */

var fs = require('fs'); 
var path = require('path');
var fileTypeReg = /\.\w+$/gi;

module.exports = function *(next) {
	
	if (isFile(this.localPath)) {
		this.file = {};
		this.file.type = path.extname(this.localPath).replace('.','');
	}
	
	yield next;
}

/**
 * 判断当前路径是否为文件
 * @param path {string} 本地路径
 * @return boolean
 */
function isFile (path) {
	if (typeof path != 'string' || !fs.existsSync(path)) {
		return;
	}
	return fs.statSync(path).isFile();
}
