/**
 * @fileoverview monkeys配置
 * @author zhenn
 * @time 2015-08-03
 */

var fs = require('fs');
var path = require('path');
var prompt = require('prompt');
var meta = require('../meta.json');

module.exports = {

	/**
	 * 设置cdn环境
	 * @param read {boolean} 是否为读操作
	 * @return void
	 */
	setCdn : function (read) {
		var self = this;

		// 如果是读取操作
		if (read) {
			console.log(meta);
			return;
		}
		var schema = {
			properties: {
				cdnLocal : {
					description : 'cdn本地开发域名',
					default : meta.cdn.local
				},
				cdnProduct : {
					description : 'cdn线上域名',
					default : meta.cdn.product
				}
			}
		};

		prompt.start();
		prompt.get(schema , function (err , data) {
			if (err) {
				throw err;
			}
			meta.cdn.local = data.cdnLocal;
			meta.cdn.product = data.cdnProduct;
			
			fs.writeFileSync(path.resolve(__dirname , '../meta.json') , JSON.stringify(meta) , 'utf-8');
		});
	}

};