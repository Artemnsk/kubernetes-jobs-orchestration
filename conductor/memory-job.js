const k8s = require('@kubernetes/client-node')
const { createAndWatch } = require('./utils')

function memoryJob(req, res) {
    const foo = req.query.foo
    if (!foo) {
        res.status(404)
        res.send('"foo" parameter is required')
        return
    }

    const reqBytes = req.query.reqBytes
    const limBytes = req.query.limBytes
    const allocBytes = req.query.allocBytes
    if (!reqBytes || !limBytes || !allocBytes) {
        res.status(404)
        res.send('"reqBytes" and "limBytes" parameters are both required')
        return
    }

    const name = 'memory-job-' + foo
    const image = 'memory-job'
    const envVars = { FOO: foo, ALLOC_BYTES: allocBytes }
    const containerResReqs = new k8s.V1ResourceRequirements()
    containerResReqs.requests = {
        memory: reqBytes,
        cpu: '100m',
    }
    containerResReqs.limits = {
        memory: limBytes,
        cpu: '100m',
    }
    createAndWatch(name, image, envVars, containerResReqs)
        .then(text => {
            res.status(200)
            res.send(text)
        })
        .catch((e) => {
            res.status(500)
            res.json(e)
        })
}

module.exports = { memoryJob }
