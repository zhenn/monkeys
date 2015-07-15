/**
 * @fileoverview 类属性相关的扩展
 * @author 子虔
 * @date    2014-08-18 17:41:24
 */
(function(module){
	var parseParam = require('../util/parseParam/index'),
		slice = Array.prototype.slice;

	module.exports = {
		/**
		 * 过滤实例时的参数
		 * @example
		 * 		defaults: {
		 * 			box: 1,
		 * 			color: red
		 * 		}
		 *
		 * 		new Class({
		 * 			color: blue,
		 * 			num: 100
		 * 		})
		 *
		 * 		attributes: {
		 *			box: 1,
		 *			color: blue
		 * 		}
		 */
		constructor: function() {
			var args = slice.call(arguments, 0),
				options = args[0];

			args[0] = parseParam(this.defaults || {}, options);

			this.Parent.apply(this, args);
		},
		/**
		 * 设置参数，可通过`a/b/c/d`的方式设置
		 * @example:
		 * 		defaults: {
		 * 			a: {
		 * 				b: {
		 * 					c: {
		 * 						e: 3
		 * 						d: 2
		 * 					}
		 * 				}
		 * 			}
		 * 		}
		 *
		 * 		this.set('a/b/c/d',3);
		 *
		 * 		attributes: {
		 * 			a: {
		 * 				b: {
		 * 					c: {
		 * 						e: 3,
		 * 						d: 2
		 * 					}
		 * 				}
		 * 			}
		 * 		}
		 */
		set: function(name, value, slient) {
			var data,
				names,
				lastValue,
				that = this;
			if (typeof name == 'string') {
				names = name.split('/');
				len = names.length;
				if (len > 1) {
					names.forEach(function(item, index) {
						if (index == len - 1) {
							lastValue = data[item];
							data[item] = value;
							if (!slient && lastValue != value) {
								bubbling.call(that, names, value, lastValue);
							}
						} else {
							data = data || that.attributes;
							data[item] = data[item] || {};
							data = data[item];
						}
					});
					return;
				}
			}

			function bubbling(names, value, lastValue) {
				var name = names.length == 1 ? names[0] : names.join('/');

				if (names.length > 0) {
					this.trigger('change:' + name, value, lastValue);
					names.pop();
					bubbling.call(this, names, value, lastValue);
				}
			}

			return this.Parent.apply(this, arguments);
		},
		/**
		 * 获取参数,可通过`a/b/c/d`获取如上`set`例子中的`d`值
		 */
		get: function(name) {
			var that = this,
				names,
				value,
				data,
				len;

			if (typeof name == 'string') {
				names = name.split('/');
				len = names.length;
				if (len > 1) {
					names.forEach(function(item, index) {
						if (index == len - 1 && data && typeof data == 'object') {
							value = data[item];
						} else {
							data = data || that.attributes;
							data[item] = data[item];
							data = data[item];
						}
					});
					return value;
				}
			}

			return this.Parent.apply(this, arguments);
		}
	};
})(module);