/**
 * @fileoverview 基础Event
 * @author 子虔
 * @date    2014-08-04 16:11:13
 */
(function(module) {
	var Callbacks = require('./callbacks/index'),
		util = {},
		channelObj = {};

	util.extend = require('../util/extend/index');

	// 统一事件机制
	var Events = {
		Event: Callbacks,
		on: function(name, callback) {
			var obj;

			this.events = this.events || {};

			if (!this.global && name.indexOf('/') != -1) {
				// 频道监听
				if (name.split('/')[0] == 'channel') {
					return this.channel.on(name.replace(/^channel\//gi, ''), callback);
				}

				obj = getObjectByNames(name, this);
				this.events[name] = this.events[name] || [];
				this.events[name].push(callback);
				return obj ? obj.on(getEventName(name), callback) : this;
			} else {
				obj = this.events[name] || (this.events[name] = this.Event());
			}



			return obj.add(callback);
		},
		off: function(name, callback) {
			var obj,
				funs;

			this.events = this.events || {};

			if (!this.global && name && name.indexOf('/') != -1) {
				if (name.split('/')[0] == 'channel') {
					return this.channel.off(name.replace(/^channel\//gi, ''), callback);
				}

				if (this.events[name]) {
					obj = getObjectByNames(name, this);
					if (callback) {
						return obj ? obj.off(getEventName(name), callback) : this;
					} else {
						funs = this.events[name];
						for (var i = 0; obj && funs && i < funs.length; i++) {
							obj.off(getEventName(name), funs[i]);
						}
						this.events[name] = null;
					}
				}

				return this;
			}

			if (name && callback && (obj = this.events[name])) {
				obj.remove(callback);
			} else if (name && (obj = this.events[name])) {
				obj.empty();
			} else {
				for (var name in this.events) {
					if (this.events.hasOwnProperty(name) && this.events[name]) {
						if (!this.global && name.indexOf('/') != -1) {
							if (name.split('/')[0] == 'channel') {
								return this.channel.onf(name.replace(/^channel\//gi, ''));
							}
							this.off(name);
						} else {
							this.events[name].empty();
						}
					}
				}
			}

			return this;
		},
		trigger: function() {
			var name = arguments[0],
				obj,
				param;

			this.events = this.events || {};
			param = Array.prototype.slice.call(arguments, 1);

			if (!this.global && name && name.indexOf('/') != -1) {
				if (name.split('/')[0] == 'channel') {
					return this.channel.trigger.apply(this.channel, [name.replace(/^channel\//gi, '')].concat(param));
				}
				obj = getObjectByNames(name, this);
				name = getEventName(name);
				return obj ? obj.trigger.apply(obj, [name].concat(param)) : this;
			}

			if (name && (obj = this.events[name])) {
				obj.fire.apply(this, [].concat(param));
			}

			return this;
		},
		fire: function() {
			return this.trigger.apply(this, arguments);
		},
		emit: function(){
			return this.trigger.apply(this,arguments);
		}
	};

	// getObjectByNames
	function getObjectByNames(name, context) {
		var context = context || {},
			that = context,
			names = name.split('/'),
			len = names.length;

		for (var i = 0; len > 1 && i < len - 1; i++) {
			if (that && that[names[i]]) {
				that = that[names[i]];
			} else {
				that = null;
			}
		}

		return that;
	}

	// getEventName
	function getEventName(name) {
		var names = name.split('/');
		return names[names.length - 1];
	}

	// global single Event
	Events.channel = util.extend(channelObj, Events),
	Events.channel.global = Events.channel;

	module.exports = Events;
})(module);