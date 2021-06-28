module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/' // /my-pwa/
    : '/',
  pages: {
    index: {
      entry: 'src/main.js',
      title: 'Mi GPS'
    },
    404: {
      entry: 'src/main.js',
      template: "public/index.html",
      filename: "404.html",
      title: 'Mi GPS'
    },
  },
  pwa: {
    name: 'Mi GPS', // my-pwa
    themeColor: '#9900aa',
    workboxPluginMode: "InjectManifest", // GenerateSW
    workboxOptions: {
      swSrc: "./src/service-worker.js"
    },
    manifestOptions: {
      background_color: "#9900aa"
    }
  },
  transpileDependencies: [
    'vuetify'
  ],
}
