var webpack = require("webpack"),
    dev_server = require("webpack-dev-server"),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    args = process.argv,
    debug = args.indexOf("--debug") > -1,
    build_realse = args.indexOf("--build-release") > -1,
    pkg = require("./package.json"),
    logConfig = {
        hash: true,
        version: false,
        assets: true,
        chunks: false,
        chunkModules: false,
        modules: false,
        cached: false,
        reasons: false,
        source: false,
        errorDetails: false,
        chunkOrigins: false,
        modulesSort: false,
        chunksSort: false,
        assetsSort: false
    },

    _config = {
        entry:{
            index:['./src/index.js'],
            detail:['./src/detail.js']
        },
        output: {
            path: __dirname + "/dist/" ,
            filename: pkg.version+"/[name]" + (build_realse ? ".min.js" : ".js")
        },
        module: {
            loaders: [
                {
                    test: /\.html$/,
                    loader: "html-clean!html-loader?minimize=false"
                },
                {
                    test: /\.css$/,
                    loader: ExtractTextPlugin.extract("style-loader", "css-loader")
                },
                {
                    test: /\.(png|jpg|svg|gif|eot|woff|ttf)$/,
                    loader: 'file-loader?name=[path]/[hash:8].[ext]'
                }]
        }
        , plugins: [
            new ExtractTextPlugin(pkg.version+"/bundle" + (build_realse ? ".min.css" : ".css"))
        ]
    },
    compiler, server;

if (debug) {
    _config.devtool= 'cheap-module-eval-source-map';
    _config.entry.index.push('webpack/hot/dev-server');
    _config.plugins.push(new webpack.HotModuleReplacementPlugin());
} else if (build_realse) {
    _config.plugins.push(new webpack.optimize.UglifyJsPlugin());
}

compiler = webpack(_config);

if (debug) {
    server = new dev_server(compiler, {
        hot: true
    });
    server.listen(8080, "0.0.0.0", function () {

    });
} else {
    compiler.run(function (err, status) {
        if (err) {
            console.warn(err);
        }
        console.log(status.toJson(logConfig));
    });
}