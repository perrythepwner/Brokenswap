const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  const SRV_PORT = process.env.REACT_APP_SRV_PORT || '8000'
  app.use(
    '/rpc',
    createProxyMiddleware({
      target: `http://localhost:${SRV_PORT}` || 'http://localhost:8000',
      changeOrigin: true,
    })
  )
}
