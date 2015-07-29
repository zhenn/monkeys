## changelog
----

### v1.0.5

- 中间件增加对js文件输出时做px转换rem操作
- 打包时做同样处理

### v1.0.4

- 增加对开放平台sdk的打包支持
- 形如(seed.js)
	- require('xxx')
	- require('yyy')
- 打包后的js文件不包含amd声明语句

### v1.0.3

- 去除构建对r.js的依赖，自定义模块依赖树分析
- 增加css、js文件的压缩
