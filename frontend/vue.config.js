const fs = require('fs');

module.exports = {
    filenameHashing: false,
    devServer: {
        https: {
            key: fs.readFileSync('../localhost.key'),
            cert: fs.readFileSync('../localhost.crt'),
        },
        host: '0.0.0.0',
        port: 3029,
        proxy: {
            '/api': {
                target: 'https://localhost:3082',
                changeOrigin: true,
            },
            '/json': {
                target: 'https://localhost:3082',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'https://localhost:3082',
                changeOrigin: true,
            },
        },
    },
    configureWebpack: {},
    pluginOptions: {
        webpackBundleAnalyzer: {
            openAnalyzer: false,
        },
    },
    productionSourceMap: false,
};
