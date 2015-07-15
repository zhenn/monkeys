
/**
 * 对日期的处理方法
 * @author liying.chen@asiainnovations.com
 * @date 2015-6-15
 */


var prefixed = function (str) {
	return str.length == 1 ? ('0' + str) : str;
};

module.exports = {
	/**
	 * 根据串返回时间对象
	 * @param  {[type]} time [description]
	 * @return {[type]}
	 */
	build: function(time) {
		var builtTime;

		switch (typeof(time)) {
			case 'number':
				builtTime = new Date(parseInt(time));
				break;
			case 'string':
				builtTime = Number(time) ? arguments.callee(parseInt(time)) : new Date(time.replace(/-/g, '/').replace('+0800', ''));
				break;
			default:
				builtTime = time instanceof Date ? time : new Date();
		}

		if (builtTime == 'Invalid Date') {
			if (time == 'string') {
				builtTime = (function() {
					var arr = time.split(' '),
						year = Number(arr[0].split('-')[0]),
						month = Number(arr[0].split('-')[1]) - 1,
						day = Number(arr[0].split('-')[2]),
						hour = Number(arr[1].split(':')[0]),
						minute = Number(arr[1].split(':')[1]),
						second = Number(arr[1].split(':')[2]);
					return new Date(year, month, day, hour, minute, second);
				})();
			}
		}

		if (builtTime == 'Invalid Date') {
			throw new Error('[TimeFormater]: Invalid Date!');
		}

		return builtTime;
	},
	/**
	 * 格式化时间
	 * @param  {String} time          时间串
	 * @param  {String} formatPattern 要格式化后的格式
	 * @param  {String} language      语言，默认为`CH`
	 * @return {[type]}
	 */
	format: function(time, formatPattern, language) {
		var timeSlices;
		time = this.build(time);
		formatPattern = formatPattern || 'yyyy/MM/dd HH:mm:ss';
		language = /^(CH|EN)$/i.test(language) ? language.toUpperCase() : 'CH';

		// Hours/Minutes/Seconds.
		timeSlices = {
			'h+': time.getHours() > 12 ? time.getHours() - 12 : time.getHours(),
			'H+': time.getHours(),
			'm+': time.getMinutes(),
			's+': time.getSeconds()
		};

		for (var timeSlice in timeSlices) {
			formatPattern = formatPattern.replace(new RegExp(timeSlice, 'g'), function(matchStr) {
				return prefixed(timeSlices[timeSlice], Math.min(2, matchStr.length));
			});
		}

		// Milliseconds.
		formatPattern = formatPattern.replace(/f+/g, function(matchStr) {
			return prefixed(time.getMilliseconds(), 3).substr(0, Math.min(matchStr.length, 3));
		});

		// Year.
		formatPattern = formatPattern.replace(/y+/g, function(matchStr) {
			return matchStr.length < 3 ? prefixed(time.getFullYear() % 1000, Math.min(matchStr.length, 2)) : prefixed(time.getFullYear(), matchStr.length);
		});

		// Month.
		formatPattern = formatPattern.replace(/M+/g, function(matchStr) {
			return matchStr.length < 3 ? prefixed(time.getMonth() + 1, matchStr.length) : getMonthStr(time.getMonth(), matchStr.length == 3, language);
		});

		// Date.
		formatPattern = formatPattern.replace(/d+/g, function(matchStr) {
			return matchStr.length < 3 ? prefixed(time.getDate(), matchStr.length) : getDateStr(time.getDate(), language);
		});

		// Weekday.
		formatPattern = formatPattern.replace(/w+/g, function(matchStr) {
			return getWeekdayStr(time.getDay(), matchStr.length < 2, language);
		});

		return formatPattern;
	},
	/**
	 * 获取两个时间差，并可按某种格式返回
	 * @param  {String} startTime     开始时间
	 * @param  {String} endTime       结束时间
	 * @param  {String} formatPattern 格式,默认为`d天h小时m分s秒f毫秒`
	 * @return {[type]}
	 */
	diff: function(startTime, endTime, formatPattern) {
		var oriFormatPattern = formatPattern,
			timeDifference,
			timeSlices;

		startTime = this.build(startTime);
		endTime = this.build(endTime);
		formatPattern = formatPattern || 'd天h小时m分s秒f毫秒';
		timeDifference = Math.abs(endTime.getTime() - startTime.getTime());
		timeSlices = [{
			pattern: /d+/g,
			rate: 24 * 60 * 60 * 1000
		}, {
			pattern: /h+/g,
			rate: 60 * 60 * 1000
		}, {
			pattern: /m+/g,
			rate: 60 * 1000
		}, {
			pattern: /s+/g,
			rate: 1000
		}, {
			pattern: /f+/g,
			rate: 1
		}];

		for (var i = 0; i < timeSlices.length; ++i) {
			timeSlices[i].value = timeDifference;
			for (var j = 0; j < i; ++j) {
				if (formatPattern.match(timeSlices[j].pattern)) {
					timeSlices[i].value -= timeSlices[j].value * timeSlices[j].rate;
				}
			}
			timeSlices[i].value = Math.floor(timeSlices[i].value / timeSlices[i].rate);
		}

		for (var i = 0; i < timeSlices.length; ++i) {
			formatPattern = formatPattern.replace(timeSlices[i].pattern, function(matchStr) {
				var subLen = Math.min(matchStr.length, (i == 0 ? Infinity : (i == 4 ? 3 : 2)));
				return prefixed(timeSlices[i].value, subLen);
			});
		}

		formatPattern = oriFormatPattern ? formatPattern : formatPattern.replace(/(\d+)(?:天|小时|分|秒|毫秒)/g, function(matchStr, num) {
			return Number(num) ? matchStr : '';
		});
		return (endTime >= startTime ? '' : '-') + formatPattern;
	},
	/**
	 * 根据当前时间，判断时间是今天、明天还是昨天
	 * @param  {[type]} time    [description]
	 * @param  {[type]} current [description]
	 * @return {[type]}
	 */
	parseDayStyle: function(time, current) {
		var date = this.format(time, 'yyyy-MM-dd'),
			currentDate = this.format(current, 'yyyy-MM-dd'),
			val = (this.build(date) - this.build(currentDate)) / (1000 * 60 * 60 * 24);

		if (val == 0) {
			return '今天';
		} else if (val == -1) {
			return '昨天';
		} else if (val == 1) {
			return '明天'
		}
	}
};

function getCnNum(num) {
	var cnNum = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
	return num < 11 ? cnNum[num] : (num < 20 ? '十' + cnNum[num % 10] : cnNum[Math.floor(num / 10)] + '十' + cnNum[num % 10]);
};

function getMonthStr(month, isAbbr, language) {
	switch (language) {
		case 'CH':
			return getCnNum(month + 1) + '月';
		case 'EN':
			return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month].substr(0, isAbbr ? 3 : undefined);
		default:
			return '';
	}
};

function getWeekdayStr(weekday, isAbbr, language) {
	switch (language) {
		case 'CH':
			return (isAbbr ? '周' : '星期') + (weekday ? getCnNum(weekday) : '日');
		case 'EN':
			return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday].substr(0, isAbbr ? 3 : undefined);
		default:
			return '';
	}
};

function getDateStr(date, language) {
	switch (language) {
		case 'CH':
			return getCnNum(date) + '日';
		case 'EN':
			return date + (date % 10 < 4 && Math.floor(date / 10) != 1 ? ['th', 'st', 'nd', 'rd'][date % 10] : 'th');
		default:
			return '';
	}
};
