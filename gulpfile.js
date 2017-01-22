var gulp = require('gulp');
var coffee = require('gulp-coffee');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var connect = require('gulp-connect');

gulp.task('coffee', function() {
  gulp.src([
    'js/maze.coffee', 'js/game.coffee', 'js/io.coffee', 'js/ui.coffee',
    'js/anim.coffee', 'js/theme.coffee',
    'js/theme-topdown.coffee', 'js/theme-basic.coffee', 'js/theme-pkmngs.coffee',
    'js/examples.coffee',
    'js/main.coffee',
  ])
  .pipe(sourcemaps.init())
  .pipe(coffee({bare: true}))
  .pipe(concat('main.js'))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('js'));
});

gulp.task('coffee:watch', function() {
  gulp.watch('js/*.coffee', ['coffee']);
});

gulp.task('devserver', function() {
  connect.server({
    port: 8080,
  });
});

gulp.task('default', ['coffee', 'coffee:watch', 'devserver']);
