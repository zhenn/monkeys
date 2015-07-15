/**
 * fileoverview 访问mp3
 * author: zhenn
 */

var fs = require('fs'); 

module.exports = function *(next) {
	var mediaTypes = ['ogg','mp3','m4a','ac3'];
	if (this.file && mediaTypes.indexOf(this.file.type) > -1) {
		var stream = fs.createReadStream(this.localPath, {
			flags : "r", 
			encoding : null
		});
		// this.set('Content-Type' , 'image/' + this.file.type);
		this.set('Accept-Ranges' , 'bytes');
		this.set('Access-Control-Allow-Origin' , '*');
		this.body = stream;	
	}

	yield next;
}
