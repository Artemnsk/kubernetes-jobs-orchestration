const { createAndWatch } = require('./utils')

function simpleJob(req, res) {
    const foo = req.query.foo
    if (!foo) {
        res.status(404)
        res.send('"foo" parameter is required')
        return
    }

    const fail = req.query.fail
    const name = 'simple-job-' + foo
    const envVars = { FOO: foo }
    if (fail) {
        envVars.FAIL = fail
    }
    createAndWatch(name, envVars)
        .then(text => {
            res.status(200)
            res.send(text)
        })
        .catch((e) => {
            res.status(500)
            res.json(e)
        })
}

module.exports = { simpleJob }
