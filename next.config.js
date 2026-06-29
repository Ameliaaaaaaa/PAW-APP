/**
 * @type {path | path.PlatformPath}
 */

const path = require('path');

const nextConfig = {
    output: 'export',
    turbopack: {
        root: path.resolve(__dirname, '../..')
    },
    devIndicators: false,
    typescript: {
        ignoreBuildErrors: true
    },
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            'renderer': path.resolve(__dirname)
        };

        return config;
    }
};

module.exports = nextConfig;