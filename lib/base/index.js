/**
 * @fileOverview 组件基类
 * @authors 子虔
 * @date    2014-05-12 17:39:36
 * @version 0.1
 */
(function(module) {
	var Events = require('./events'),
		extend = require('./extend'),
		util = {};
		
	util.extend = require('../util/extend/index');
	/**
	 * 组件Base类
	 * @param {[type]} Opts [description]
	 */
	function Base(Opts) {
		// 默认配置
		this.defaults = this.defaults || {};

		// 用户配置
		this.config = Opts || {};

		// 最终配置
		this.attributes = util.extend(this.attributes || {}, this.defaults);

		if (typeof this.config == 'object') {
			this.attributes = util.extend(this.attributes, this.config);
		}

		this.initialize.apply(this, arguments);
	}

	// 扩展
	util.extend(Base.prototype, Events, {
		constructor: Base,
		/**
		 * 初始化接口
		 * @return {[type]}
		 */
		initialize: function() {},

		/**
		 * 频道
		 */
		channel: Events.channel,

		/**
		 * 获取配置
		 * @param  {[type]} name [description]
		 * @return {[type]}
		 */
		get: function(name) {
			return this.attributes[name];
		},

		/**
		 * 设置配置
		 * @param {[String]}{[Object]} name  [属性名]
		 * @param {[Any]} value [属性值]
		 * @param {[Boolean]} slient [是否派发事件，默认派发]
		 */
		set: function(name, value, slient) {
			var lastValue;
			if (typeof name == 'object') {
				slient = value;
				for (var key in name) {
					this.set(key, name[key], slient);
				}
			} else {
				lastValue = this.attributes[name];
				this.attributes[name] = value;
				if (!slient && lastValue != value) {
					this.trigger('change:' + name, value);
				}
			}
		},

		/**
		 * 重置配置
		 * @param  {[array]} wlist [不需要重置的list]
		 * @return {[type]}
		 */
		reset: function(wlist, slient) {
			wlist = wlist || [];

			if (arguments.length > 1) {
				slient = !!wlist;
				wlist = [];
			}

			for (var key in this.attributes) {
				if (wlist.indexOf(key) == -1) {
					this.set(key, this.attributes[key], slient);
				}
			}
		},
		destroy: function() {
			this.off();
		}
	});

	/**
	 * 继承和扩展
	 * @param  {Object} protoProps  子类的prototype
	 * @param  {[type]} staticProps 子类的静态方法或属性
	 * @return {Class}
	 */
	Base.extend = extend;
	module.exports = Base;

})(module);