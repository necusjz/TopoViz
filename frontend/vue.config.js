module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
        ? '/'
        : '/',
    outputDir: 'dist',
    productionSourceMap: false
}