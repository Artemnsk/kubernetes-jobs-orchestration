const app = require('express')()
const httpServer = require('http').createServer(app)

app.get('/', (req, res) => {
    res.status(200)
    res.send('Hello!')
})

app.get('/simple-job', require('./simple-job').simpleJob)

const PORT = 8081
httpServer.listen(PORT, () => {
    console.log(`Server run on port ${PORT}`)
})
