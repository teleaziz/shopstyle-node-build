var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var DEV = !argv.release;
var STYLE_LOADER = 'style-loader';
var CSS_LOADER = DEV ? 'css-loader' : 'css-loader?minimize';
var webpack = require('webpack');
var path = require('path');

// TODO:
// module.exports = new SSTest(require('ss-config')).karma;

// TODO: share config with main webpack

module.exports = function(config) {
  config.set({
    files: [
      'client/**/*.spec.ts'
    ],

    preprocessors: {
      // add webpack as preprocessor
      'client/**/*.spec.ts': ['webpack']
    },

    webpack: require('./webpack.config.js')

    frameworks: ['mocha', 'chai'],

    reporters: ['dots', 'coverage'],

    browsers: ['PhantomJS'],

    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-phantomjs-launcher'),
      require('karma-coverage'),
      require('karma-chai'),
      require('karma-sourcemap-loader')
    ],

    coverageReporter: {
      type: 'lcov',
      dir: './dist/client/coverage'
    }
  });
};
