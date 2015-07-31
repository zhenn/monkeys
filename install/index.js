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
	start : function (name) {

		var self = this;
		var metaJSON = self.getMata();
		var widgetUrl = self.getWidgetUrl(name , metaJSON);

		if (!this.widgetList || this.widgetList.length > 0) {
			this.widgetList = [];
		}
		
		self.installWidget(metaJSON , widgetUrl);
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
		nodeHttp.GET(url, function (response) {
			var content = response.buffer.toString('utf-8');
			var localPath = process.cwd() + '/' + baseWidgetPath + '/' + url.replace(meta['widget']['base'] + meta['widget'].version + '/js/' , '');
			var name = url.replace(/.*\/js\//gi , '').split('/')[0];

			filetool.writefile(localPath , response.buffer);

			self.widgetList.push(name);
			var requireList = self.getDeps(url , content);

			if (requireList.length == 0 && !self.notify) {
				self.notify = 1;
				console.log(('组件成功安装至: ' + process.cwd() + '/' + baseWidgetPath).green);
				console.log(('列表: ' + _.uniq(self.widgetList).join('、')).gray);
			}
			requireList.forEach(function (v , index) {
				self.installWidget(meta , v);
			});
		});
	},

	getRequireList : function (content) {
		var requireReg = /require\(['"](.+?)['"]\)/gi;
		var requireList = content.match(requireReg) && content.match(requireReg).map(function (v , index) {
			return v.replace(requireReg , function ($1 , $2) {
				return $2;
			});
		});

		return requireList || [];
	},

	getDeps : function ( url , content) {
		var self = this;
		var requireList = self.getRequireList(content).map(function (v) {
			var pathname = path.dirname(url);
			return 'http://' + path.resolve(pathname.replace('http://' , '') , v).replace(process.cwd() + '/' , '') + '.js';
		});
		
		return requireList;
	}

};