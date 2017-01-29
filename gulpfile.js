var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var connect = require('gulp-connect');

var rollup = require('rollup');
var rollup_babel = require('rollup-plugin-babel');
var rollup_uglify = require('rollup-plugin-uglify');

var jsCache;
gulp.task('js', function() {
	// Thanks https://code.lengstorf.com/learn-rollup-js/
	return rollup.rollup({
		entry: 'js/app.js',
		cache: jsCache,
		external: [
			'jquery', 'hammerjs'
		],
		plugins: [
			rollup_babel({
				// transpiles ES6 to ES5
				babelrc: false,
				exclude: 'node_modules/**',
				presets: ["es2015-rollup"],
			}),
			rollup_uglify(),
		],
	}).then(function(bundle) {
		jsCache = bundle;
		bundle.write({
			format: 'iife', // immediately invoked function expression
			dest: 'js/compiled.js',
			sourceMap: true,
			globals: {
				jquery: '$',
				hammerjs: 'Hammer',
			},
		});
	});
});

gulp.task('js:watch', function() {
	gulp.watch(['js/**/*.js', '!js/compiled.js'], ['js']);
});

gulp.task('sass', function () {
	gulp.src('css/app.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(rename('compiled.css'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('css'));
});

gulp.task('sass:watch', function() {
	gulp.watch('css/**/*.scss', ['sass']);
});

gulp.task('server', function() {
	connect.server({
		port: 8080,
	});
});

gulp.task('default', ['js', 'js:watch', 'sass', 'sass:watch', 'server']);
