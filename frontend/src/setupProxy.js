const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  const NAME = process.env.REACT_APP_NAME || 'blockchain_brokenswap_backend'
  const SRV_PORT = process.env.REACT_APP_SRV_PORT || '8888'
  app.use(
    '/rpc',
    createProxyMiddleware({
      target: `http://blockchain_${NAME}_backend:${SRV_PORT}` || 'http://localhost:3001',
      changeOrigin: true,
    })
  )
}
