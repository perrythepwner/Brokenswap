const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  const PUBLIC_IP = process.env.REACT_APP_PUBLIC_IP || 'localhost'
  const SRV_PORT = process.env.REACT_APP_SRV_PORT || '3001'
  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://${PUBLIC_IP}:${SRV_PORT}` || 'http://localhost:3001',
      changeOrigin: true,
    })
  )
}
