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
            app:['./source/app.js']
        },
        output: {
            path: __dirname + "/dist/",
            filename: "bundle_" + pkg.version + (build_realse ? ".min.js" : ".js")
        },
        module: {
            loaders: [
                {
                    test: /\.html$/,
                    loader: "html-loader"
                },
                {
                    test: /\.css$/,
                    loader: ExtractTextPlugin.extract("style-loader", "css-loader")
                },
                {
                    test: /(\.js)$/,
                    loader:["babel"] ,
                    exclude:/node_modules/,
                    query:{
                        presets:["es2015"]
                    }
                },
                {
                    test: /\.(png|jpg|svg|gif|eot|woff|ttf)$/,
                    loader: 'url-loader?limit=4086&name=[path][hash:8].[ext]'
                }]
        },
        plugins: [
            // new ExtractTextPlugin("bundle_" + pkg.version + (build_realse ? ".min.css" : ".css"))
        ]
    },
    compiler, server;

if(debug){
    _config.devtool= 'source-map';
    _config.entry.app.push('webpack/hot/dev-server');
    _config.entry.app.push('webpack-dev-server/client?http://127.0.0.1:8080');
    _config.plugins.push(new webpack.HotModuleReplacementPlugin());
}else if(build_realse) {
    _config.plugins.push(new webpack.optimize.UglifyJsPlugin());
}

compiler = webpack(_config);

if (debug) {
    server = new dev_server(compiler, {
        hot: true,
        inline:true,
        stats: { colors: true }
    });
    server.listen(8080, "127.0.0.1", function () {
    });
} else {
    compiler.run(function (err, status) {
        if (err) {
            console.warn(err);
        }
        console.log(status.toJson(logConfig));
    });
}
