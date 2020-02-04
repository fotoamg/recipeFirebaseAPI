const { src, dest, watch } = require('gulp');

function copyFunctions(cb) {
    src('./functions/index.js')
    .pipe(dest('./public/functions'));

    src('./functions/package.json')
    .pipe(dest('./public/functions'));

    src('./functions/index.html')
    .pipe(dest('./public/functions'));
    
    src('./functions/firebaseMethods.js')
    .pipe(dest('./public/functions'));
    cb();
}

function copyApi(cb) {
    src('./functions/api/*.js')
    .pipe(dest('./public/functions/api'));
    cb();
}
function copyBll(cb) {
    src('./functions/logic/*.js')
    .pipe(dest('./public/functions/bll'));
    cb();
}

exports.default = function() {
    // You can use a single task
    watch('./functions/**', { ignoreInitial: false }, copyFunctions);
    watch('./functions/api/**', { ignoreInitial: false }, copyApi);
    watch('./functions/logic/**', { ignoreInitial: false }, copyBll);
  };
