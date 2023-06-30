const fs = require('fs')
const vm = require('vm')
const path = require('path')
const gulp = require('gulp')
const gutt = require('gulp-gutt')
const rename = require('gulp-rename')
const browserStringifier = require('./')
const BrowserSync = require('browser-sync').create()

let browserSync

function requireAsync(module, callback) {
	return new Promise(function (resolve, reject) {
		fs.readFile(module, { encoding: 'utf8' }, function (err, code) {
			if (err) {
				console.error('here is error', err)
				return reject(err)
			}

			const sandbox = {
				module: {
					exports: {}
				},
				require: require,
				console: console
			}

			try {
				vm.runInNewContext(code, sandbox)
				resolve(sandbox.module.exports)
			} catch (error) {
				reject(error.stack)
			}
		})
	})
}

function start(done) {
	browserSync = BrowserSync.init({
		server: {
			baseDir: "./playground"
		}
	})

	gulp.watch(['./*.js', 'playground/**/*.{html,gutt}'], templates)
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
	.catch((error) => {
		if (browserSync) {
			browserSync.publicInstance.notify(
				`<pre style="text-align: left">${error}</pre>`,
				5000
			)
		}
	})
}

module.exports.default = gulp.series(templates, start)
module.exports.templates = templates
