const { src, dest, watch } = require('gulp');


/*function defaultTask(cb) {
    // place code for your default task here
    gulp.task('copy', function () {
        gulp.src('./index.html')
            .pipe(gulp.dest('./public/'));
    });
        cb();
}

exports.default = defaultTask*/

function copyIndex(cb) {
    src('./index.html')
    .pipe(dest('./public/'));
    cb();
}

function copyCss(cb) {
    src('./resources/css/**/*.*')
    .pipe(dest('./public/resources/css'));
    cb();
}

function copyFunctions(cb) {
    src('./functions/index.js')
    .pipe(dest('./public/functions'));
    src('./functions/package.json')
    .pipe(dest('./public/functions'));
    cb();
}

function copyApi(cb) {
    src('./functions/api/*.js')
    .pipe(dest('./public/functions/api'));
    cb();
}
function copyBll(cb) {
    src('./functions/bll/*.js')
    .pipe(dest('./public/functions/bll'));
    cb();
}
function copyCommon(cb) {
    src('./functions/common/*.js')
    .pipe(dest('./public/functions/common'));
    cb();
}

exports.default = function() {
    // You can use a single task
    watch('./functions/**', { ignoreInitial: false }, copyFunctions);
    watch('./functions/api/**', { ignoreInitial: false }, copyApi);
    watch('./functions/bll/**', { ignoreInitial: false }, copyBll);
    watch('./functions/common/**', { ignoreInitial: false }, copyCommon);
  };
