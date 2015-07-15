
module.exports = {
	replaceVersion : function (sourceConent , curVal , targetVal) {
		var reg = new RegExp(curVal , 'gi');
		return sourceConent.replace(reg , targetVal);
	}
};
