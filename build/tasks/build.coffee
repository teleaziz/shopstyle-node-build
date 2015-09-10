# TODO: move to typescript and independent task files

_ = require 'lodash'
runSequence = require 'run-sequence'
$ = require('gulp-load-plugins')()
{ exec, spawn } = require 'child_process'
chalk = require 'chalk'
localtunnel = require 'localtunnel'

# TODO: get from configs
PORT = 3000

colorsIndex = 0
colors = ['cyan', 'magenta', 'blue', 'yellow']

module.exports = (gulp, config) ->

  # Get local node module binary path
  bin = (binary) ->
    "./node_modules/.bin/#{binary}"

  handleErrors = ->
    $.plumber errorHandler: (error) ->
      notifier.notify
        title: 'Gulp Build Error'
        subtitle: error.plugin
        message: error.message
        wait: true

  spaces = (number) ->
    if not number or number < 0
      return ''

    _.range(number)
      .map(=> ' ')
      .join ''

  lastCommand = null
  run = (command, cb, options = {}) =>
    split = _.compact command.split /\s+/
    command = split.shift()

    spawned = spawn command, split, _.defaults {}, options, cwd: process.cwd()

    commandEnding = _.last command.split('/')
    commandSpaces = 9 - commandEnding.length

    prefixOutput = (output, color = 'cyan') ->
      if command isnt lastCommand
        process.stdout.write '\n'

      lastCommand = command

      output = output.toString()
      list = _.compact output.split '\n'
      list = list.map (str) =>
        chalk[color]("[#{commandEnding}] ") + (spaces commandSpaces) + str
      list.join('\n') + '\n'

    color = colors[colorsIndex++]

    if colorsIndex >= colors.length
      colorsIndex = 0

    spawned.stdout.on 'data', (data) ->
      process.stdout.write prefixOutput data, color

    spawned.stderr.on 'data', (data) ->
      process.stderr.write prefixOutput data, 'red'

    spawned.on 'close', cb

  gulp.task 'help', $.taskListing.withFilters /:/

  gulp.task 'default', ['help']

  # TODO: move tsd here
  # TODO: move all to bower
  gulp.task 'install', ->
    gulp
      .src ['package.json', 'tsd.json', 'bower.json']
      .pipe $.install()

  gulp.task 'git:pull', (cb) ->
    # TODO: upstream
    $
      .git
      .pull 'origin', 'master',
        args: '--rebase'
      , (err) ->
        throw err if err
        cb()

  gulp.task 'develop', [
      # 'webpack:watch'
      'nodemon'
      # 'schemas'
      'slc:arc'
      # 'karma:watch' # TODO: fix and add back.
      'watch'
      # 'localtunnel' # FIXME: this causes problems
      'typedoc'
    ]

  watch = (pattern, callback) ->
    if _.isArray callback
      tasks = callback
      callback = -> runSequence tasks...

    $.watch pattern, callback

  gulp.task 'watch', ->
    # TODO: mocha test on server updates
    # TODO: show mac notifications (optionally) when these tasks have errors
    watch 'client/**/*.scss',                       ['patternlint:scss']
    watch '{client,common,server,build}/**/*.ts',   ['tslint', 'typedoc', 'patternlint:ts']
    watch 'client/**/*.html',                       ['htmlhint', 'patternlint:html']
    # watch 'common/{schemas,models}/**/*.json',      ['schemas']
    watch '{bower,tsd,package}.json',               ['install']
    null

  # TODO: fix the dtsgen lib it sucks
  gulp.task 'schemas', (cb) ->
    run "#{bin 'dtsgen'} --out dist/schemas.d.ts ./common/schemas/**/*.json ./common/models/**/*.json", cb

  gulp.task 'localtunnel', ->
    # TODO: get port from configs
    localtunnel PORT, (err, tunnel) ->
      throw err if err
      console.log chalk.green """
        \n
        broadcasting server on: #{tunnel.url}
        \n
      """

  gulp.task 'patternlint:ts', ->
    gulp
      .src('{client,build,server,config}/**/*.ts')
      .pipe(handleErrors())
      .pipe($.patternlint([]))
      .pipe($.patternlint.reporter());

  gulp.task 'patternlint:scss', ->
    gulp
      .src('client/**/*.scss')
      .pipe(handleErrors())
      .pipe($.patternlint([]))
      .pipe($.patternlint.reporter());

  gulp.task 'patternlint:html', ->
    gulp
      .src('client/**/*.html')
      .pipe(handleErrors())
      .pipe($.patternlint([]))
      .pipe($.patternlint.reporter());

  gulp.task 'webdriver:update', (cb) ->
    run "#{run 'webdriver-manager'} update", cb

  gulp.task 'webdriver:start', (cb) ->
    run "#{run 'webdriver-manager'} start", cb

  gulp.task 'protractor:run', (cb) ->
    run "#{run 'protractor'} protractor.config.js", cb

  # TODO
  gulp.task 'tslint', ->
    # TODO: handleErrors (plumber + notifications)
    # run "#{bin 'tslint'} -f "

    gulp
      .src(['{client,server,build,common}/**/*.ts', '!build/templates/**/*.ts'])
      .pipe(handleErrors())
      .pipe($.tslint())
      .pipe($.tslint.report('verbose'));

  # TODO
  gulp.task 'htmlhint', ->

  # TODO: browsersync
  gulp.task 'nodemon', (cb) ->

    # TODO: get paths from configs
    # TODO: these paths aren't working...
    run "#{bin 'nodemon'} -e js,ts,json --watch server --watch common --watch webpack.config.js ./server", cb

  # TODO: configure port
  gulp.task 'slc:arc', (cb) ->
    # TODO: port config
    run "#{bin 'slc'} arc --cli", cb, env: _.extend {}, process.env, PORT: 5494

  gulp.task 'webpack:watch', (cb) ->
    run bin('webpack'), cb

  gulp.task 'karma:watch', (cb) ->
    run "#{bin 'karma'} start karma.config.js", cb

  gulp.task 'typedoc', ->
    gulp
      .src '+(client|server|common)/**/*.ts'
      .pipe(handleErrors())
      # TODO: use tsconfig and typeconfig
      .pipe $.typedoc
        # TODO: get crom configs, allow config overriding
        out: 'dist/client/docs'
        mode: 'file'
        module: 'CommonJS'
        hideGenerator: true
        noLib: false
        target: 'ES5'
        name: 'ionic-boilerplate'
        theme: 'default'
        ignoreCompilerErrors: true
        experimentalDecorators: true
        version: true
        json: 'dist/docs/json'
