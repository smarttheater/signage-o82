const { resolve } = require('path');
const nodeExternals = require('webpack-node-externals');
const keysTransformer = require('ts-transformer-keys/transformer').default;

module.exports = {
    target: 'node',
    node: {
        __dirname: true,
    },
    mode: 'development',
    // devtool: 'inline-source-map',
    externals: [nodeExternals()],
    context: resolve(__dirname, 'server'),
    entry: {
        bundle: './index.ts',
    },
    output: {
        filename: 'index.js',
        path: resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.ts$/,
                use: [
                    {
                        loader: 'tslint-loader',
                        options: {
                            typeCheck: true,
                            fix: true,
                        },
                    },
                ],
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    configFile: 'tsconfig.json',
                    getCustomTransformers: (program) => ({
                        before: [keysTransformer(program)],
                    }),
                },
            },
            // {
            //     enforce: 'pre',
            //     test: /\.js$/,
            //     use: 'source-map-loader',
            // },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
};
