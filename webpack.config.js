const webpack = require('webpack');
const fs = require('fs')
const path = require('path');


var nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function(x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function(mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });

//console.log('Node Modules: '+ JSON.stringify(nodeModules));
module.exports =

    {
        // The configuration for the server-side rendering
        name: 'server',
        target: 'node',
        entry: './server/index.js',
        output: {
            path: './bin/',
            publicPath: 'bin/',
            filename: 'server.js'
        },
        externals: nodeModules,
        module: {
            loaders: [
                {
                    test: /\.js?$/,
                    exclude: /(node_modules|bower_components)/,
                    loader: 'babel-loader',
                    query: {
                        presets: ['es2015']
                    }
                },
                { test:  /\.json$/, loader: 'json-loader' }

            ]
        }
    };