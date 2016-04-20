/**
 * fileoverview 访问swf
 * author: zhenn
 */

var fs = require('fs'); 

module.exports = function *(next) {
	var mediaTypes = ['swf', 'm3u8', 'ts'];
	var mimeMap = {
		swf: 'application/x-shockwave-flash',
		m3u8: 'application/x-mpegURL',
		ts: 'video/MP2T'
	};
	if (this.file && mediaTypes.indexOf(this.file.type) > -1) {
		// console.log(this.file.type)
		var stream = fs.createReadStream(this.localPath, {
			flags : "r", 
			encoding : null
		});
		this.set('Content-Type' , mimeMap[this.file.type]);
		this.set('Accept-Ranges' , 'bytes');
		this.set('Access-Control-Allow-Origin' , '*');
		this.body = stream;	
	}


	yield next;
}
