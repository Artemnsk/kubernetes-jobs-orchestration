const app = require('express')()
const httpServer = require('http').createServer(app)

app.get('/', (req, res) => {
    res.status(200)
    res.send('Hello!')
})

const PORT = 8081
httpServer.listen(PORT, () => {
    console.log(`Server run on port ${PORT}`)
})
