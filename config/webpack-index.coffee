path = require 'path'
webpack = require 'webpack'
merge = require 'webpack-merge'

nodeExternals = require 'webpack-node-externals'
current = process.cwd()

coffee =
  test: /\.coffee$/
  loader: 'coffee-loader'
  options:
    transpile:
      plugins: [
        "@babel/plugin-transform-modules-commonjs"
      ]
      presets: [
        ["env", 
          targets:
            node: "6.11.5"
        ]
      ]

typescript =
  test: /\.ts$/
  loader: 'ts-loader'

module.exports =
  mode: 'production'
  target: 'node' # Important
  devtool: 'source-map'
  entry:
    "lib/index.min":  './src/index.coffee'
  output:
    path: current
    filename: '[name].js' # Important
    library: 'FancyDate'
    libraryTarget: 'umd' # Important

  module:
    rules: [
      coffee
      typescript
    ]

  resolve:
    extensions: [ '.coffee', '.ts', '.js' ]

  externals: [nodeExternals()] # Important

  plugins: [
  ]
