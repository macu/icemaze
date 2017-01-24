var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var connect = require('gulp-connect');

var rollup = require('rollup');
var rollup_babel = require('rollup-plugin-babel');
var rollup_resolve = require('rollup-plugin-node-resolve');
var rollup_commonjs = require('rollup-plugin-commonjs');
var rollup_uglify = require('rollup-plugin-uglify');

var jsCache;
gulp.task('js', function() {
	return rollup.rollup({
		entry: 'js/app.js',
		cache: jsCache,
		external: [
			'jquery', 'hammerjs'
		],
		plugins: [
			rollup_resolve({
				jsnext: true,
				main: true,
				browser: true,
			}),
			rollup_commonjs(),
			rollup_babel({
				babelrc: false,
				exclude: 'node_modules/**',
				presets: ["es2015-rollup"],
			}),
			(process.env.NODE_ENV === 'production' && rollup_uglify()),
		],
	}).then(function(bundle) {
		jsCache = bundle;
		bundle.write({
			format: 'iife',
			dest: 'js/compiled.js',
			sourceMap: true,
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

gulp.task('devserver', function() {
	connect.server({
		port: 8080,
	});
});

gulp.task('default', ['js', 'js:watch', 'sass', 'sass:watch', 'devserver']);
