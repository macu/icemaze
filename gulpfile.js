var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var rollup = require('gulp-rollup');
var buble = require('rollup-plugin-buble');
var vue = require('rollup-plugin-vue');
var scss = require('rollup-plugin-scss');
var uglify = require('rollup-plugin-uglify');
var replace = require('rollup-plugin-replace');
var rename = require('gulp-rename');

// var vueifyCaches = {};
gulp.task('vueify', function() {
	return gulp.src('./src/**/*.{js,scss,vue}')
		.pipe(sourcemaps.init())
		.pipe(rollup({
			// https://www.npmjs.com/package/gulp-rollup#options
			entry: './src/app.js',
			impliedExtensions: ['.js', '.vue'],
			allowRealFiles: true,
			moduleName: 'app',
			// separateCaches: vueifyCaches, // https://github.com/vuejs/rollup-plugin-vue/issues/67
			format: 'iife',
			external: [
				// names of modules that are external dependencies
				'jquery',
				'vue',
				'vue-router',
			],
			globals: {
				// global names to import from external dependencies
				'jquery': '$',
				'vue': 'Vue',
				'vue-router': 'VueRouter',
			},
			plugins: [
				vue({
					// http://rollup-plugin-vue.znck.me/configuration/
					compileTemplate: true,
					styleToImports: true,
				}),
				scss({
					output: './css/compiled.css',
					outputStyle: 'compressed',
				}),
				buble(),
				uglify(),
				replace({
					// "development" or "production" mode
					'process.env.NODE_ENV': '"development"',
				}),
			],
		}))
		// .on('bundle', function(bundle, name) {
		// 	vueifyCaches[name] = bundle;
		// })
		.on('error', function(e) {
			console.error(e);
		})
		.pipe(rename('compiled.js'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./js'));
});

gulp.task('default', ['vueify']);
