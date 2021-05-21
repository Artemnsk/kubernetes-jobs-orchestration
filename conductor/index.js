const app = require('express')()
const httpServer = require('http').createServer(app)

const PORT = 8081
httpServer.listen(PORT, () => {
    console.log(`Server run on port ${PORT}`)
})
