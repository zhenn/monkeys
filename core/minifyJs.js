var uglify = require('uglify-js');

module.exports = function (content) {
    var ast,
        err,
        compressor,
        newContent;

    try {
        ast = uglify.parse(content);
    } catch (e) {
        err = JSON.stringify(e);
    }

    if (!err) {
        ast.figure_out_scope();
        compressor = uglify.Compressor({
            sequences: false,
            warnings: false
        });
        ast = ast.transform(compressor);

        ast.figure_out_scope();
        ast.mangle_names({
            except: ['require', 'define', 'exports', 'module']
        });
        newContent = ast.print_to_string({
            ascii_only: true
        }) + '';
    }

    return err ? content : newContent;
};