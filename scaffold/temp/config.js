({
    appDir: './',
    baseUrl: 'temp/js/',
    dir: './.dist/',
    modules: [
        {
            name: 'index'
        }
    ],

    // 正则所匹配的文件名会被跳过
    fileExclusionRegExp: /^((config)\.js)|(\.gitignore)|(meta\.json)|(.+?.html)$/,

    // 是否压缩css
    optimizeCss: 'standard',

    // 删除被合并的文件
    // 只保留未被合并的文件(一定是主程序入口)
    removeCombined: true,

    // 只能从本地路径中查询
    // 相对于baseURL
    paths: {
		h5lib : '../../../h5lib/src/js',
        module: '../../../module/src/js'
    }
})
