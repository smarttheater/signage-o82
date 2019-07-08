const { resolve } = require('path');
const nodeExternals = require('webpack-node-externals');
const keysTransformer = require('ts-transformer-keys/transformer').default;
const TSLintPlugin = require('tslint-webpack-plugin');

module.exports = {
    target: 'node',
    node: {
        __dirname: true,
    },
    mode: 'development',
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
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    configFile: 'tsconfig.json',
                    experimentalWatchApi: true,
                    getCustomTransformers: (program) => ({
                        before: [keysTransformer(program)],
                    }),
                },
            },
        ],
    },
    plugins: [
        new TSLintPlugin({
            files: './server/**/*.ts',
            waitForLinting: true,
            warningsAsError: true,
            config: './tslint.json',
        }),
    ],
    resolve: {
        extensions: ['.ts', '.js'],
    },
};
