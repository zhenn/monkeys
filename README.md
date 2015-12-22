# Monkeys
____

## 一，概述：

monkeys是一个前端开发工具集合，基于[koa](http://koajs.com/)框架开发，功能涉及以下环节

- **项目初始化** —— 创建项目基本结构，并初始化git提交远程仓库
- **本地web服务** —— 类似于apache、nginx，优势在于不需要繁琐的配置，可在任意目录启动，启动后当前目录即为web服务根目录
- **构建** —— html编译，css、javascript压缩合并等
- **部署** —— 提供项目部署快捷方式，如创建git tag并推送到远程仓库

## 二，规范

### 1，目录结构

	project
		|-- src						开发目录
			 |-- js
			 |-- css
			 |-- images
			 |-- index.html
		|-- build					发布目录
			 |-- js
			 |-- css
			 |-- images
			 |-- index.html
		|-- meta.json				项目元数据（配置）——详见meta详解
		|-- .gitignore              git配置		
		|-- README.md				项目文档
		
上述目录结构，是monkeys基于I/O实时编译及打包的基础规范。

- 新项目可使用`monkeys init`命令初始化项目，会自行创建以上规范目录
- 老的维护性项目，则需先按以上规范调整目录，方可适应`monkeys`

在项目初始化时，工具只会创建开发时所需必要资源，如`src/*` `meta.json` `.gitignore` `README.md`，build目录将在构建项目时自动创建。另外，src目录下html文件可以是多个，且文件名称均可自定义。


### 2，meta.json

	{
		"name" : "ssdz",
		"version" : "1.1.2",
		"deps" : {
			"h5lib" : "../h5lib:1.0.2",
			"module" : "../module:1.1.7"
		},
		"widget" : {
			"base" : "http://p1.cdn.pengpengla.com/module/",
			"version" : "1.1.6"
		},
		"build" : {
			"amdJsCombine" : true
		}
	}
	
**name：**项目名称

**version：**项目版本号

**deps**

声明项目依赖

**widget**

声明组件配置，包括源、版本信息

**build**

项目构建的相关配置




### 2，项目依赖

在实际的业务场景中，有很多通用、共用的组件和模块，分布在不同的代码仓库中。

通常情况下，前端通用UI组件、功能组件会被从业务仓库中独立出来管理，如何能让这些通用模块作用于其它业务项目中？项目依赖管理正是为了解决这个问题。

依赖管理具体体现在meta.json中，一个真实有效的依赖关系声明方式如下：

	{
		"name" : "ssdz",
		"version" : "1.1.2",
		"deps" : {
			"h5lib" : "../h5lib:1.0.2",
			"module" : "../module:1.1.7"
		},
		"widget" : {
			"base" : "http://p1.cdn.pengpengla.com/module/",
			"version" : "1.1.6"
		},
		"build" : {
			"amdJsCombine" : true
		}
	}

其中每个字段的详解



### 3，其它规范

## 三，安装

在安装monkeys之前，请确保本地已安装NodeJS，且版本>=0.11.x。若需要升级node版本，推荐使用node的版本工具 [n](https://www.npmjs.com/package/n)，可以很方便管理本地的node版本，避免繁琐的编译按钮过程。

`n stable`升级到最稳定版本。

执行如下命令安装monkeys
	
	npm install monkeys -g



## 四，使用方法

### 1，项目初始化

	monkeys init
	
### 2，启动web服务

	sudo monkeys start
	
默认监听80端口，sudo权限不可或缺，若80端口已被占用，monkeys将给出友情提示，如**`端口:80已被占用或链接超时`**

当然，你也可以选择监听其它端口。

	monkeys start --port 8000
	
其他细节

	sudo monkeys start --cssize 640

### 3，安装js组件

	monkeys isntall widgetName	
	
### 4，构建

在构建阶段，分为`stage`、`product`两种模式，stage相当于在正式发布前做预演，通常情况下规则不同于正式构建，而product不需多做解释，即为正式上线部署准备代码包！

执行样例：

	monkeys build --stage

### 5，部署

TODO...




