var path                  = require('path');
var webpack               = require('webpack');
var _                     = require('lodash');
var minimist              = require('minimist');
var glob                  = require('glob');
var Clean                 = require('clean-webpack-plugin');
var HtmlWebpackPlugin     = require('html-webpack-plugin');
var fs                    = require('fs');
var WebpackNotifierPlugin = require('webpack-notifier');
// var config                = require('@popsugar/shopstyle-node-config');
var config = {};

// TODO: move to typescript
var pkg = require(path.join(process.cwd(),'./package.json'));

// TODO: create super entry that includes all components in one

var argv = minimist(process.argv.slice(2));
var DEV = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
var HOT = DEV;
var STYLE_LOADER = 'style-loader';
var CSS_LOADER = DEV ? 'css-loader' : 'css-loader?minimize';
var GLOBALS = {
  'ENV': process.env.NODE_ENV || DEV ? '"development"' : '"production"'
};

// FIXME: NASTY hack for process hanging
if (!DEV) {
  _.delay(function () {
    process.exit(0);
  }, 30000);
}

var paths = {
  dist: 'dist',
  client: 'client',
  server: 'server',
  build: 'build',
  components: 'components'
};

// TODO: how to watch and update on changes
var componentsPath = path.join(paths.client, paths.components);

var routes = (config.routes ? config.routes.slice() : []);

// config.routes = config.routes || [];

// Load route configs from @State decorators in component files
var componentFiles = glob.sync(path.join(process.cwd(), 'client/components/**/*-component.ts'));
componentFiles.forEach(function (file) {
  var contents = fs.readFileSync(file, 'utf8');
  var matches = contents.match(/@State\(([\s\S]+?)\)/);
  var configString = matches && matches[1];
  var routeConfig;

  if (configString) {
    try {
      routeConfig = (new Function('return ' + configString))();
    } catch (error) {
      console.warn('Could not parse state config string: ', configString);
    }
  }

  if (routeConfig) {
    if (!routeConfig.component) {
      routeConfig.component = file.match(/([^\/]+?)-component\.ts$/)[1];
    }

    routes.push(routeConfig);
  }
});

var components = routes
  .filter(function (routeConfig) {
    return !!routeConfig.component;
  })
  .map(function (routeConfig) {
    var source;
    var name = routeConfig.component;

    if (!routeConfig.path) {
      if (routeConfig.module) {
        source = path.join(process.cwd(), 'node_modules', routeConfig.module);
      } else {
        source = process.cwd();
      }

      routeConfig.path = path.join(source, componentsPath, name, name + '-component.ts');
    }

    return routeConfig;
  });

var entryComponents = components.reduce(function (memo, componentConfig) {
  memo[componentConfig.component] = [componentConfig.path];
  return memo;
}, {});

// TODO: _.merge webpack configs
var config = {
  cache: DEV,
  watch: DEV,

  stats: {
    colors: true,
    reasons: DEV,
    progress: true
  },

  resolveLoader: {
    root: path.join(__dirname, './node_modules')
  },

  context: process.cwd(),

  resolve: {
    extensions: ['', '.ts', '.js'],
    alias: {

    },
    modulesDirectories: [
      path.join(process.cwd(), 'node_modules'),
      path.join(process.cwd(), 'bower_components'),
      path.join(__dirname, 'node_modules'),
      path.join(__dirname, 'bower_components')
    ]
  },

  // TODO: this being used by server middleware? if not kill
  devServer: {
    contentBase: './dist/client',
    inline: true,
    hot: true,
    historyApiFallback: true,
    stats: { colors: true },
    proxy: {
      api: "http://localhost:3000"
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
        loader: 'awesome-typescript',
        exclude: /\.d\.ts$/
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
    noParse: /(\/ace-builds|\.d\.ts$)/
  },
  entry: _.extend({}, entryComponents, {
    init: [
      path.join(process.cwd(), 'client/scripts/init.ts')
    ].concat(DEV ? [path.join(__dirname, 'node_modules/webpack-hot-middleware/client.js?reload=true&overlay=true')] : [])
  }),
  output: {
    path: path.join(process.cwd(), './dist/client'),
    publicPath: '/',
    filename: '[name]-[hash].js'
  },
  plugins: [
    new webpack.PrefetchPlugin(path.join(process.cwd(), 'client/scripts/dependencies/app.ts')),
    new webpack.PrefetchPlugin(path.join(process.cwd(), 'client/styles/dependencies/app.scss')),
    new webpack.optimize.CommonsChunkPlugin('common', 'common-[hash].js'),
    new webpack.optimize.AggressiveMergingPlugin(),
    new HtmlWebpackPlugin({
      title: _.startCase(pkg.name),
      templateContent: fs.readFileSync('./client/index.html', 'utf8')
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin(GLOBALS),
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
    new webpack.ExtendedAPIPlugin(),
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
    new webpack.optimize.AggressiveMergingPlugin()
  ])
};

module.exports = config;
