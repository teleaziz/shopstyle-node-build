var path                  = require('path');
var webpack               = require('webpack');
var _                     = require('lodash');
var minimist              = require('minimist');
var glob                  = require('glob');
var Clean                 = require('clean-webpack-plugin');
var HtmlWebpackPlugin     = require('html-webpack-plugin');
var fs                    = require('fs');
var WebpackNotifierPlugin = require('webpack-notifier');

// module.exports = new SSBuild(require('ss-config')).webpack;

// TODO: load from process.cwd()
var pkg = require(path.join(process.cwd(),'./package.json'));

// TODO: create super entry that includes all components in one

var argv = minimist(process.argv.slice(2));
var HOT = true;
var DEV = !argv.release;
var STYLE_LOADER = 'style-loader';
var CSS_LOADER = DEV ? 'css-loader' : 'css-loader?minimize';
var GLOBALS = {
  'process.env.NODE_ENV': process.env.NODE_ENV || DEV ? '"development"' : '"production"'
};

var paths = {
  dist: 'dist',
  client: 'client',
  server: 'server',
  build: 'build',
  components: 'components'
};

// TODO: how to watch and update on changes
var componentsPath = path.join('.', paths.client, paths.components);

// TODO: get from routes config instead
var components = glob
  .sync(path.join(componentsPath, '*'))
  .map(function (path) {
    return _.last(path.split('/'));
  })
  // Exclude components all depend on,
  // TODO: find a way to automate this
  .filter(function (name) {
    // TODO: use route config instead
    return !_.contains(['app', 'head', 'body', 'side-menu', 'targeting-rules-editor'], name);
    // return _.contains(['data', 'metrics'], name);
  });

var componentPaths = components.map(function (name) {
  return path.join(process.cwd(), componentsPath, name, name + '-component.ts');
});

var entryComponents = componentPaths.reduce(function (memo, filePath, index) {
  memo[components[index]] = [
    filePath
    // , 'webpack-hot-middleware/client'
    // , 'webpack/hot/dev-server'
  ];
  return memo;
}, {});

// TODO: _.merge webpack configs
var config = {
  cache: DEV,
  // debug: DEV,
  watch: DEV,
  unsafeCache: DEV,

  stats: {
    colors: true,
    reasons: DEV,
    progress: true
  },

  resolveLoader: {
    root: path.join(__dirname, './node_modules')
  },

  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx', '.ts', '.json'],
    alias: {

    },
    modulesDirectories: [
      'node_modules',
      'bower_components'
    ]
  },

  devServer: {
    contentBase: './dist/client',
    // contentBase: "http://localhost:3000/",

    inline: true,
    hot: true,
    historyApiFallback: true,
    // publicPath: "http://localhost:3000/",
    stats: { colors: true },
    proxy: {
      "api": "http://localhost:3000"
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
        test: /\.css$/,
        loader: [STYLE_LOADER, CSS_LOADER].join('!')
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
    ],
    // TODO: noParse all bower components
    noParse: /bower_components\/ace-builds\/src-noconflict/
  },
  entry: _.extend({}, entryComponents, {
    init: [
      path.join(process.cwd(), 'client/scripts/init.ts')
      , 'webpack-hot-middleware/client?reload=true&overlay=true'
      // , 'webpack/hot/dev-server'
    ]
  }),
  output: {
    path: path.join(process.cwd(), './dist/client'),
    publicPath: '/',
    filename: '[name]-[hash].js'
  },
  // devtool: DEV ? 'eval' : false,
  plugins: [
    new webpack.PrefetchPlugin(path.join(process.cwd(), 'client/scripts/dependencies/app.ts')),
    new webpack.PrefetchPlugin(path.join(process.cwd(), 'client/styles/dependencies/app.scss')),
    // new Clean(['dist/client']),
    new webpack.optimize.CommonsChunkPlugin('common', 'common-[hash].js'),
    new webpack.optimize.AggressiveMergingPlugin(),
    new HtmlWebpackPlugin({
      title: _.startCase(pkg.name),
      templateContent: fs.readFileSync('./client/index.html', 'utf8')
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.ExtendedAPIPlugin(),
    new webpack.DefinePlugin(_.merge(GLOBALS, { '__SERVER__': false })),
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('package.json', ['main'])
    ),
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
    )
  ].concat(DEV ? [
    // Dev plugins
    new WebpackNotifierPlugin()
    , new webpack.HotModuleReplacementPlugin()
    , new webpack.NoErrorsPlugin()
  ] : [
    // Release plugins
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.AggressiveMergingPlugin()
  ])
};

module.exports = config;
