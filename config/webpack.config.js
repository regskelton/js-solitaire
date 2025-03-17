const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const UglifyPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const paths = require('./paths');
const env = process.env.NODE_ENV;
const config = env === 'development'
    ? require('./development.js')
    : require('./production.js');

const { inject } = config;

const plugins = [

    new CopyWebpackPlugin({
        patterns: [
            { from: '**/*', transform: (content, path) =>
                {
                    let changed = content.toString();
                    for (const key in inject) {
                        changed = changed.replace(`%${key}%`, inject[key]);
                    }
                    return changed;
                },
              globOptions: {
                    ignore: ['*.png', '*.jpg', '*.jpeg', '*.gif', '*.js', '*.ico', '*.scss'] }
                }
        ],
    }),
    new CopyWebpackPlugin({
        patterns: [{
            from: '**/*.{png,jpg,jpeg,gif,ico}',
            noErrorOnMissing: true
        }]
    })
];

if (env === 'production') {
    plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
    );
} else {
    plugins.push(
        new webpack.NamedModulesPlugin()
    );
}

module.exports = {
    context: paths.src,
    devtool: 'cheap-module-source-map',
    entry: paths.index,
    output: {
        path: paths.build
    },
    module: {
        strictExportPresence: true,
        rules: [{
            exclude: [
                /\.html$/,
                /\.js$/,
                /\.css$/,
                /\.scss$/,
                /\.json$/,
                /\.svg$/,
                /\.ico/,
                /\.bmp$/,
                /\.gif$/,
                /\.jpe?g$/,
                /\.png$/
            ],
            loader: require.resolve('file-loader'),
            options: {
                //name: 'static/media/[name].[hash:8].[ext]'
            }
        }, {
            test: /\.js$/,
            include: paths.src,
            loader: 'babel-loader',

            options: {
                presets: ['@babel/preset-env'],
                cacheDirectory: true
            }
        }, {
            test: /\.(css|scss)$/,
            use: [
                require.resolve('style-loader'),
                {
                    loader: require.resolve('css-loader'),
                    options: {
                        modules: false,
                        sourceMap: false,
                        //localIdentName: env === 'development' ? '[local]' : '[hash:base64:5]'
                    }
                },
                {
                    loader: require.resolve('postcss-loader'),
                    options: {
                        postcssOptions: {
                            // Necessary for external CSS imports to work
                            // https://github.com/facebookincubator/create-react-app/issues/2677
                            //ident: 'postcss',
                            plugins: () => [
                                require('cssnano'),
                                require('postcss-flexbugs-fixes'),
                                autoprefixer({
                                    browsers: [
                                        '>1%',
                                        'last 4 versions',
                                        'Firefox ESR',
                                        'not ie < 9' // React doesn't support IE8 anyway
                                    ],
                                    flexbox: 'no-2009'
                                })
                            ]
                        }
                    }
                }, {
                    loader: "sass-loader",
                    options: {
                        implementation: require("sass"),
                    },
                }
            ]
        }]
    },
    plugins: plugins,
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    resolve: {
        fallback: {
            dgram: false,
            fs: false,
            net: false,
            tls: false,
            child_process: false
        }
    },
    // Turn off performance hints during development because we don't do any
    // splitting or minification in interest of speed. These warnings become
    // cumbersome.
    performance: {
        hints: false
    }
};
