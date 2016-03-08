/**
 * fileoverview 访问image
 * author: zhenn
 */

var fs = require('fs'); 

module.exports = function *(next) {
	var imgTypes = ['jpeg','jpg','tiff','raw','bmp','gif','png','mp3','svg'];
	
	if (this.file && imgTypes.indexOf(this.file.type) > -1) {
		var curIndex = imgTypes.indexOf(this.file.type);
		var stream = fs.createReadStream(this.localPath, {
			flags : "r", 
			encoding : null
		});
		
		this.set('Content-Type' , 'image/' + (this.file.type == 'svg' ? (this.file.type + '+xml') : this.file.type));
		this.set('Accept-Ranges' , 'bytes');
		this.set('Access-Control-Allow-Origin' , '*');
		this.body = stream;	
	}

	yield next;
}