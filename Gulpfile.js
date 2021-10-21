const fs = require('fs')
const vm = require('vm')
const path = require('path')
const gulp = require('gulp')
const gutt = require('gulp-gutt')
const rename = require('gulp-rename')
const browserStringifier = require('./')
const browserSync = require('browser-sync').create()

function requireAsync(module, callback) {
	return new Promise(function (resolve, reject) {
		fs.readFile(module, { encoding: 'utf8' }, function (err, code) {
			if (err) {
				return reject(err)
			}

			const sandbox = {
				module: {
					exports: {}
				},
				require: require,
				console: console
			}

			vm.runInNewContext(code, sandbox)

			resolve(sandbox.module.exports)
		})
	})
}

function start(done) {
	browserSync.init({
        server: {
            baseDir: "./playground"
        }
    })

    gulp.watch('playground/**/*.{html,gutt}', templates).on('change', browserSync.reload)
    gulp.watch('./*.js', templates).on('change', browserSync.reload)
}

function templates() {
	const nonCachedFiles = [
		'index.js',
		'boilerplate.js',
		'logic-handler.js',
		'templates.js'
	]

	return requireAsync('./index.js').then(function (browserStringifier) {
		nonCachedFiles.forEach(function (filename) {
			delete require.cache[path.resolve(__dirname, filename)]
		})

		return gulp
			.src('playground/**/*.gutt', { read: false, base: 'playground' })
			.pipe(gutt(browserStringifier({ type: 'module' })))
			.pipe(rename(file => {
				file.extname = '.gutt.js'
				return file
			}))
			.pipe(gulp.dest('playground'))
	})
}

module.exports.default = gulp.series(templates, start)
module.exports.templates = templates
