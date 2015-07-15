/**
 * @fileoverview css文件过滤
 * @author zhenn
 */

module.exports = {

	/**
	 * 转换px到rem
	 * @param size {number} 设计稿的宽度
	 * @param content {start} css内容
	 */
	changePxToRem : function (content , size) {
		var sizeReg = /(\d+)px/gi;
		if (!size) {
			return content;
		}
		return content.replace(sizeReg , function ($1 , $2 , index , source) {
			return ($2 * 2) / (size / 10) + 'rem'; 
		});
	}

};