/**
 * fileoverview 访问swf
 * author: zhenn
 */

var fs = require('fs'); 

module.exports = function *(next) {
	var mediaTypes = ['swf'];
	if (this.file && mediaTypes.indexOf(this.file.type) > -1) {
		var stream = fs.createReadStream(this.localPath, {
			flags : "r", 
			encoding : null
		});
		this.set('Content-Type' , 'application/x-shockwave-flash');
		this.set('Accept-Ranges' , 'bytes');
		this.set('Access-Control-Allow-Origin' , '*');
		this.body = stream;	
	}

	yield next;
}
