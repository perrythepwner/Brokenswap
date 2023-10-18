module.exports = {
  eslint: {
    enable: false,
  },
  typescript: { enableTypeChecking: false },
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1973
  devServer: {
    port: process.env.HTTP_PORT || 3001
  }
}
