const path = require('path')
const http = require('http')
const express = require('express')
const socketIO = require('socket.io')

const publicPath = path.join(__dirname, './public')


const PORT = process.env.PORT || 3001

var app = express()
var server = http.createServer(app)
var io = socketIO(server)

app.use(express.static(publicPath));


server.listen(PORT, () => {
  console.log("Web server listen on port ", PORT)
})



