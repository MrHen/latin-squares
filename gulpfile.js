var del = require('del');
var gulp = require('gulp');
var gulp_bower = require('gulp-bower');
var gulp_changed = require('gulp-changed');
var gulp_filter = require("gulp-filter");
var gulp_gh_pages = require('gulp-gh-pages');
var gulp_inject = require('gulp-inject');
var gulp_typescript = require('gulp-typescript');
var gulp_typings = require('gulp-typings');
var gulp_util = require('gulp-util');
var gulp_nodemon = require('gulp-nodemon');
var main_bower_files = require('main-bower-files');
var run_sequence = require('run-sequence');

var configs = {
    inject : {
        bower: {
            name: 'bower',
            addRootSlash: false
        }
    },

    mocha: {},

    typings: {
      config: './typings.json'
    },

    typescript: {
        config: 'tsconfig.json',
        overrides: {}
    },

    watcher: {
        interval: 1000
    }
};

var locations = {
    sources: "src/**/*",

    output: "app",
    test: "app/**/*.spec.js",
    deploy: "app/**/*",
    start: "app/app.js",
    bower: "app/bower_components",
    typings: "typings/browser.d.ts",

    inject: {
        dest: 'app',
        src: 'app/index.html'
    },

    filters: {
        copy: ['**/*.{html,css,json}'],
        typescript: ['**/*.ts', '!**/*.spec.ts'],
        tests: ['**/*.spec.ts']
    },

    watch: {
        restart: ["app/**/*"]
    }
};

////////
// Clean
////////

gulp.task('clean', function(callback) {
    run_sequence('clean:client', callback);
});

gulp.task('purge', function(callback) {
    run_sequence('clean:client', 'clean:typings', callback);
});

gulp.task('clean:client', function() {
    return del([locations.output + '/*']);
});

gulp.task('clean:deploy', function() {
    return del(['.publish/*']);
});

gulp.task('clean:typings', function () {
    return del(['typings/*']);
});

////////
// Watch
////////

gulp.task('watch', ['build:client'], function() {
    return gulp.watch(locations.sources, configs.watcher, ['build:client'])
        .on('change', function (event) {
            gulp_util.log("[" + gulp_util.colors.cyan("watch") + "]", 'File ' + event.path + ' was ' + event.type);
        });
});

////////
// Build
////////

gulp.task('build', function(callback) {
    run_sequence('build:client', callback);
});

gulp.task('build:client', ['build:typings', 'build:bower'], function(callback) {
    run_sequence('build:client:typescript', 'build:client:copy', 'build:inject', callback);
});

gulp.task('build:client:copy', function() {
    var copyFilter = gulp_filter(locations.filters.copy);

    return gulp.src(locations.sources)
        .pipe(copyFilter)
        .pipe(gulp_changed(locations.output))
        .pipe(gulp.dest(locations.output));
});

var tsProject = gulp_typescript.createProject(configs.typescript.config, configs.typescript.overrides);

gulp.task('build:client:typescript', function () {
    var tsFilter = gulp_filter(locations.filters.typescript); // non-test TypeScript files

    var errors = null;
    var tsResult = gulp.src([locations.sources, locations.typings])
        .pipe(gulp_changed(locations.output, {extension: '.js'}))
        .pipe(tsFilter)
        .pipe(gulp_typescript(tsProject))
        .on('error', function(error) {
            errors = errors || error;
        })
        .on('end', function() {
            if (errors) {
                throw errors;
            }
        });

    return tsResult.js.pipe(gulp.dest(locations.output));
});

gulp.task('build:bower', function () {
    return gulp_bower().pipe(gulp.dest(locations.bower));
});

gulp.task('build:typings', function () {
  return gulp.src(configs.typings.config).pipe(gulp_typings());
});

gulp.task('build:inject', function(callback) {
    run_sequence('build:inject:bower', callback);
});

gulp.task('build:inject:bower', function() {
    return gulp.src(locations.inject.src)
        .pipe(gulp_inject(gulp.src(main_bower_files(), {read: false}), configs.inject.bower))
        .pipe(gulp.dest(locations.inject.dest));
});

//////
// Run
//////

gulp.task('start', ['build:client'], function(callback) {
    run_sequence('start:client', callback);
});

gulp.task('start:client', function() {
    gulp_nodemon({
        script: locations.start,
        env: {
            NODE_ENV: process.env.NODE_ENV || 'development',
            NODE_CONFIG_DIR: 'app/config'
        },
        watch: locations.watch.restart,
        verbose: true
    });
});

/////////
// Deploy
/////////

gulp.task('deploy', function(callback) {
    run_sequence('deploy:ghpages', callback);
});

gulp.task('deploy:ghpages', ['build:client', 'test:run'], function() {
    return gulp.src(locations.deploy)
        .pipe(gulp_gh_pages());
});
