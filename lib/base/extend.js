/**
 * @fileoverview 继承和扩展
 * @author 子虔
 * @date    2014-08-15 11:24:20
 */
(function(module) {
	var util = {};
	
	util.extend = require('../util/extend/index');

	/**
	 * 继承和扩展
	 * @param  {Object} protoProps  子类的prototype
	 * @param  {[type]} staticProps 子类的静态方法或属性
	 * @return {Class}
	 */
	module.exports = function(protoProps, staticProps) {
		var parent = this,
			child,
			Surrogate,
			destroy;

		// The constructor function for the new subclass is either defined by you
		// (the "constructor" property in your `extend` definition), or defaulted
		// by us to simply call the parent's constructor.
		if (protoProps && protoProps.hasOwnProperty('constructor')) {
			child = protoProps.constructor;
		} else {
			child = function child() {
				return parent.apply(this, arguments);
			};
		}

		// 销毁自动继承
		if (protoProps.hasOwnProperty('destroy') && (destroy = protoProps.destroy)) {
			protoProps.destroy = function() {
				try {
					destroy.apply(this, arguments);
				} catch (e) {}
				this.Parent.apply(this, arguments);
			};
		}

		// Add static properties to the constructor function, if supplied.
		util.extend(child, parent, staticProps);

		// Set the prototype chain to inherit from `parent`, without calling
		// `parent`'s constructor function.
		Surrogate = function() {
			this.constructor = child;
		};

		Surrogate.prototype = parent.prototype;
		child.prototype = new Surrogate;

		// Add prototype properties (instance properties) to the subclass,
		// if supplied.
		if (protoProps) util.extend(child.prototype, protoProps);

		// Set a convenience property in case the parent's prototype is needed
		// later.
		child.__super__ = parent.prototype;
		child.__supClass__ = [];

		if (!parent.__supClass__) {
			child.__supClass__.push(parent, child);
		} else {
			parent.__supClass__.forEach(function(item) {
				child.__supClass__.push(item);
			});
			child.__supClass__.push(child);
		}

		// 可以用此方法调用父类的构造函数,ECMA5不支持对arguments.callee的调用
		function Parent() {
			var caller = Parent.caller,
				name,
				parent,
				supClass = this.constructor.__supClass__;

			if (!caller) return;

			supClass.forEach(function(fun, index) {
				var fn = fun.prototype;
				for (var p in fn) {
					if (fn.hasOwnProperty(p) && (fn[p] === caller)) {
						name = p;
						parent = supClass[index - 1];
					}
				}
			});

			if (name && parent) {
				if (parent.prototype[name]) {
					return parent.prototype[name].apply(this, arguments);
				}
			}
		};

		child.prototype.Parent = Parent;

		return child;
	};
})(module);