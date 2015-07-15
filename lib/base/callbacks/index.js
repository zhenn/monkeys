/**
 * @fileoverview callbacks
 * @author 子虔
 * @date    2014-08-31 12:09:10
 */
(function(module) {
	var extend = require('../../util/extend/index');

	module.exports = function(options) {
		options = extend({}, options)

		var memory, // Last fire value (for non-forgettable lists)
			fired, // Flag to know if list was already fired
			firing, // Flag to know if list is currently firing
			firingStart, // First callback to fire (used internally by add and fireWith)
			firingLength, // End of the loop when firing
			firingIndex, // Index of currently firing callback (modified by remove if needed)
			list = [], // Actual callback list
			stack = !options.once && [], // Stack of fire calls for repeatable lists
			fire = function(data) {
				memory = options.memory && data
				fired = true
				firingIndex = firingStart || 0
				firingStart = 0
				firingLength = list.length
				firing = true
				for (; list && firingIndex < firingLength; ++firingIndex) {
					if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
						memory = false
						break
					}
				}
				firing = false
				if (list) {
					if (stack) stack.length && fire(stack.shift())
					else if (memory) list.length = 0
					else Callbacks.disable()
				}
			},

			Callbacks = {
				list: list,
				add: function() {
					if (list) {
						var start = list.length,
							add = function(args) {
								args = Array.prototype.slice.call(args);
								args.forEach(function(arg, _) {
									if (typeof arg === "function") {
										if (!options.unique || !Callbacks.has(arg)) list.push(arg)
									} else if (arg && arg.length && typeof arg !== 'string') add(arg)
								})
							}
						add(arguments)
						if (firing) firingLength = list.length
						else if (memory) {
							firingStart = start
							fire(memory)
						}
					}
					return this
				},
				remove: function() {
					var args = Array.prototype.slice.call(arguments);
					if (list) {
						args.forEach(function(arg, _) {
							var index
							while ((index = list.indexOf(arg, index)) > -1) {
								list.splice(index, 1)
								// Handle firing indexes
								if (firing) {
									if (index <= firingLength)--firingLength
									if (index <= firingIndex)--firingIndex
								}
							}
						})
					}
					return this
				},
				has: function(fn) {
					return !!(list && (fn ? list.indexOf(fn) > -1 : list.length))
				},
				empty: function() {
					firingLength = list.length = 0
					return this
				},
				disable: function() {
					list = stack = memory = undefined
					return this
				},
				disabled: function() {
					return !list
				},
				lock: function() {
					stack = undefined;
					if (!memory) Callbacks.disable()
					return this
				},
				locked: function() {
					return !stack
				},
				fireWith: function(context, args) {
					if (list && (!fired || stack)) {
						args = args || []
						args = [context, args.slice ? args.slice() : args]
						if (firing) stack.push(args)
						else fire(args)
					}
					return this
				},
				fire: function() {
					return Callbacks.fireWith(this, arguments)
				},
				fired: function() {
					return !!fired
				}
			}

		return Callbacks
	}
})(module);