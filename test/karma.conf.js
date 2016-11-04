var configs = require('../configs');
var paths = require('../paths');

module.exports = function (config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: paths.root,

		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['browserify', 'jasmine'],

		// list of files / patterns to load in the browser
		files: [
			paths.unit.setup$,
			paths.unit.specs$
		],

		// list of files to exclude
		exclude: [],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'**/**/*.ts': ['browserify'],
			// 'dist/**/!(*test).ts': ['coverage']
		},
		browserify: {
			cache: {},
			packageCache: {},
			fullPaths: true,
			debug: true,
			plugin: ['watchify','tsify'],
			extensions: ['.ts'],
			transform: [
				['babelify', configs.babelify.develop]

				//, transform: ['brfs']
				//, transform: [
				//	['browserify-istanbul', {ignore: '**/**/*.test.*'}]
			]
		},

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['mocha', 'notify'],

		mochaReporter: {
			output: 'autowatch',
			showDiff: 'unified'
		},
		notifyReporter: {
			reportEachFailure: true, // Default: false, Will notify on every failed sepc
			reportSuccess: false, // Default: true, Will notify when a suite was successful
		},

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_DEBUG,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['Chrome'],

		plugins: [
			'karma-jasmine',
			'karma-coverage',
			'karma-browserify',
			'karma-chrome-launcher',
			'karma-mocha-reporter',
			'karma-notify-reporter'
		],

		coverageReporter: {
			reporters: [
				{type: 'json', subdir: '.', file: 'coverage-final.json'}
			]
		},

		//
		// // Continuous Integration mode
		// // if true, Karma captures browsers, runs the tests and exits
		singleRun: false
	});
};
