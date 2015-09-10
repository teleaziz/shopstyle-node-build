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

    webpack: {
      devtool: 'eval-cheap-source-map',
  		resolve: {
  			extensions: ['', '.js', '.ts'],
        modulesDirectories: [
          'node_modules',
          'bower_components'
        ],
        alias: {

        }
  		},
  		module: {
        loaders: [
          {
            test: /\.html$/,
            loader: 'raw!html-minify'
          }, {
            test: /\.json$/,
            loader: 'json'
          }, {
            test: /\.ts$/,
            loader: 'awesome-typescript'
          }, {
            test: /\.scss$/,
            loader: [STYLE_LOADER, CSS_LOADER, 'sass'].join('!')
          }, {
            test: /\.gif/,
            loader: 'url-loader?limit=10000&mimetype=image/gif'
          }, {
            test: /\.jpg/,
            loader: 'url-loader?limit=10000&mimetype=image/jpg'
          }, {
            test: /\.png/,
            loader: 'url-loader?limit=10000&mimetype=image/png'
          }, {
            test: /\.svg/,
            loader: 'url-loader?limit=10000&mimetype=image/svg+xml'
          }
        ]
  		},
      plugins: [
        new webpack.ExtendedAPIPlugin(),
        new webpack.ResolverPlugin(
            new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('package.json', ['main'])
        ),
        new webpack.ResolverPlugin(
            new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
        )
      ],
      externals: /^[a-z\-0-9]+$/
    },

    // frameworks: ['webpack'],

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      noInfo: true,
      stats: {
        color: true,
        chunkModules: false,
        modules: false
      }
    },

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
