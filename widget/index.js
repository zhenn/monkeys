/**
 * @fileoverview 安装h5组件到当前项目目录
 * @author zhenn
 */

// 让json支持注释
require('json-comments');
var NodeHttp = require('node-http');
var filetool = require('../lib/filetool');
var fs = require('fs');
var colors = require('colors');
var path = require('path');
var _ = require('../lib/underscore');

var baseWidgetPath = 'src/js/widget';

module.exports = {

	/**
	 * 开始下载安装组件
	 * @param name {string} 组件名称
	 * @return void
	 */
	install : function (name) {

		var self = this;
		var metaJSON = self.getMata();
		var widgetUrl = self.getWidgetUrl(name , metaJSON);

		if (!this.widgetList || this.widgetList.length > 0) {
			this.widgetList = [];
		}
		
		self.installWidget(metaJSON , widgetUrl);
	},

	/**
	 * 删除已安装组件
	 * @param name {string} 组件名称
	 * @return void
	 */
	uninstall : function (name) {
		var cwd = process.cwd();
		filetool.rmdir(cwd + '/' + baseWidgetPath + '/' + name , function () {
			console.log(('已删除组件: ' + name).red);
		});
	},

	/**
	 * 更新组件
	 * @param name {string} 组件名称
	 * @return void
	 */
	update : function (name) {
		var widgetDir = process.cwd() + '/' + baseWidgetPath;
		var widgetList = fs.readdirSync(widgetDir);
		var installed = 0;

		for (var i = 0 , len = widgetList.length; i < len; i++) {
			if (widgetList[i] == name) {
				installed = 1;
				break;
			}
		}
		if (!installed) {
			console.log('尚未安装组件: ' + name);
			return;
		}
		this.install(name);
	},

	/**
	 * 更新所有组件
	 * @param name {string} 组件名称
	 * @return void
	 */
	updateAll : function (p) {
		if (p != 'allWidget') {
			console.log('参数无效'.red);
			return;
		}
		var widgetDir = process.cwd() + '/' + baseWidgetPath;
		var widgetList = fs.readdirSync(widgetDir);

		for (var i = 0 , len = widgetList.length; i < len; i++) {
			this.install(widgetList[i]);
		}
		
	},

	/**
	 * 清空安装的组件
	 * @param name {string} 组件名称
	 * @return void
	 */
	clear : function (p) {
		if (p !== 'widget') {
			console.log('参数无效');
			return;
		}
		var cwd = process.cwd();
		var widgetDir = cwd + '/' + baseWidgetPath;
		var widgetList = fs.readdirSync(widgetDir);
		var ids = widgetList.map(function (v) {
			return widgetDir + '/' + v;
		});
		
		ids.forEach(function (v , index) {
			filetool.rmdir(v , function () {
				console.log(('删除组件: ' + path.basename(v)).red);
			});
		});
		
	},

	/**
	 * 获取当前项目的meta.json数据
	 * @param void
	 * @return object
	 */
	getMata : function () {
		return require(process.cwd() + '/meta.json')
	},

	/**
	 * 获取组件地址
	 * @param name {string} 组件名称
	 * @param meta {object} 项目meta配置数据
	 * @return string
	 */
	getWidgetUrl : function (name , meta) {
		return meta['widget']['base'] + meta['widget'].version + '/js/' + name + '/index.js';
	},

	/**
	 * 安装组件
	 */
	installWidget : function (meta , url) {
		var self = this;
		var nodeHttp = new NodeHttp; 
		console.log(('wget:   ' + url).gray);
		nodeHttp.GET(url, function (response) {
			var content = response.buffer.toString('utf-8');
			var localPath = process.cwd() + '/' + baseWidgetPath + '/' + url.replace(meta['widget']['base'] + meta['widget'].version + '/js/' , '');
			var name = url.replace(/.*\/js\//gi , '').split('/')[0];

			filetool.writefile(localPath , response.buffer);

			self.widgetList.push(name);
			var requireList = self.getDeps(url , content);

			setTimeout(function () {
				if (requireList.length == 0 && !self.notify) {
					self.notify = 1;
					console.log(('-----------------------------------------------------------').red);
					console.log(('组件成功安装至: ' + process.cwd() + '/' + baseWidgetPath).green);
					console.log(('列表: ' + _.uniq(self.widgetList).join('、')).gray);
					console.log(('-----------------------------------------------------------').red);
				}
			} , 2000);
			requireList.forEach(function (v , index) {
				self.installWidget(meta , v);
			});
		});
	},

	getRequireList : function (content) {
		var requireReg = /require\(['"](.+?)['"]\)/gi;
		var inlineReg = /__inline\(['"](.+?)['"]\)/gi;
		var requireList = [] , inlineList = [];
		requireList = content.match(requireReg) && content.match(requireReg).map(function (v , index) {
			return v.replace(requireReg , function ($1 , $2) {
				return $2;
			});
		});
		inlineList = content.match(inlineReg) && content.match(inlineReg).map(function (v , index) {
			return v.replace(inlineReg, function ($1 , $2) {
				return $2;
			});
		});
		if (!requireList) requireList = [];
		if (!inlineList) inlineList = [];
		return requireList.concat(inlineList);
	},

	getDeps : function ( url , content) {
		var self = this;
		var requireList = self.getRequireList(content).map(function (v) {
			var pathname = path.dirname(url);
			var afterFix = '';
			if (!v.match(/\.tmpl$/i)) {
				afterFix = '.js';
			}
			return 'http://' + path.resolve(pathname.replace('http://' , '') , v).replace(process.cwd() + '/' , '') + afterFix;
		});

		return requireList;
	}

};
