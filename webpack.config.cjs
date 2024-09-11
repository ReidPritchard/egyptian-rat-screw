const path = require('path');

module.exports = {
    mode: 'development',
    entry: './client/client.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
        rules: [
            // Use the inferno loader plugin to transpile inferno components
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env', '@babel/preset-typescript'],
                            plugins: ['babel-plugin-inferno', "@babel/plugin-syntax-jsx"],
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },
};