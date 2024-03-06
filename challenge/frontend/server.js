const path = require('path')
const express = require('express')
const app = express() // create express app
require('dotenv').config()

// add middlewares
app.use(express.static(path.join(__dirname, 'build')))
app.use(express.static('public'))

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

// start express server on port 5000
app.listen(process.env.HTTP_PORT, () => {
  console.log(`Server started on port ${process.env.HTTP_PORT}`)
})
//app.listen(3001, () => {
//  console.log(`Server started on port 3001`)
//})