'use strict';

// include gulp and tools
var gulp        = require('gulp');
var $           = require('gulp-load-plugins')();
var exec        = require('child_process').exec;
var browserSync = require('browser-sync');
var reload      = browserSync.reload;
var del         = require('del');
var runSequence = require('run-sequence');
var es          = require('event-stream');
var browserify  = require('browserify');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var sourcemaps  = require('gulp-sourcemaps');
var gutil       = require('gulp-util');
var glslify     = require('glslify');
var babelify    = require('babelify');
var globby      = require('globby');
var eslint      = require('gulp-eslint');
var watchify    = require('watchify');

// Clean output directories
gulp.task('clean', del.bind(null, ['dist', '.tmp']));

// HTML task
gulp.task('html', function() {
  return gulp
    .src([ 'src/**/*.html'])
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// CSS task
gulp.task('css', function() {
  return gulp
    .src([ 'src/**/*.css'])
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// JS browserify task
gulp.task('js-browserify', function() {
  var b = browserify({
      entries: './src/ami-starter.js',
      debug: true})
    .transform(babelify)
    .transform(glslify);

  b.on('error', function (err) {
    console.log(err.toString());
    this.emit("end");
  });

  return b.bundle()
    .pipe(source('ami-starter.js'))
    .pipe(gulp.dest('./dist/'));
});

// JS watchify task
gulp.task('js-watchify', function() {
  var b = browserify({
      entries: './src/ami-starter.js',
      plugin: [watchify],
      debug: true})
    .transform(babelify)
    .transform(glslify);

  b.on('error', function (err) {
    console.log(err.toString());
    this.emit("end");
  })

  b.on('update', bundle);
  b.on('log', gutil.log);

  function bundle() {
    return b.bundle()
      .pipe(source('ami-starter.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
          .on('error', gutil.log)
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./dist/'))
      .pipe(reload({stream: true, once: true}));;
  }

  return bundle();
});

// Lint js
gulp.task('lint', function() {
  return gulp
    .src([ 'src/**/*.js' ])
    .pipe(eslint())
    .pipe(eslint.format());
});

//
gulp.task('js-watch', ['lint']);
gulp.task('html-watch', ['html'], reload);
gulp.task('css-watch', ['css'], reload);

gulp.task('browsersync', function(){
    // gh-pages mode, no route to web components
  browserSync({
    server: {
      baseDir: ['dist']
    }
  });

  gulp.watch(['src/**/*.js'], ['js-watch']);
  gulp.watch(['src/**/*.html'], ['html-watch']);
  gulp.watch(['src/**/*.css'], ['css-watch']);
});


// examples task for devs
gulp.task('serve', ['default'], function(cb) {
  runSequence(
    // takes care
    ['browsersync','js-watchify'],
    cb);
});

// default build step
gulp.task('default', ['clean'], function(cb) {
  runSequence(
    'lint',
    ['html', 'css', 'js-browserify'],
    cb);
});
