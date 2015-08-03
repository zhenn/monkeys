
var fs = require('fs');
var path = require('path');

module.exports = {

	transform : function (filepath) {
		var absolutePath = process.cwd() + '/' + filepath;
		var ext = path.extname(absolutePath).replace('.','');

		fs.readFile(absolutePath, function(err, original_data){
		    var base64Image = new Buffer(original_data, 'binary').toString('base64');
		    console.log('data:image/' + ext + ';base64,' + base64Image);
		});
	}

};