const k8s = require('@kubernetes/client-node')
const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api)

function jobFactory() {
    const param = `${Date.now()}`.slice(-5)

    const job = new k8s.V1Job()
    job.apiVersion = 'batch/v1'
    job.kind = 'Job'

    const metadata = new k8s.V1ObjectMeta()
    // TODO: embed params into the name.
    metadata.name = 'simple-job-' + param
    job.metadata = metadata
    // TODO: pass some params in env variables.

    const container = new k8s.V1Container()
    container.name = 'simple-job'
    container.image = 'simple-job'
    container.imagePullPolicy = 'Never'

    const podSpec = new k8s.V1PodSpec()
    podSpec.containers = [container]
    podSpec.restartPolicy = 'Never'

    const template = new k8s.V1PodTemplateSpec()
    template.spec = podSpec

    const jobSpec = new k8s.V1JobSpec()
    jobSpec.template = template

    job.spec = jobSpec

    return job
}

function simpleJob(req, res) {
    k8sBatchApi.createNamespacedJob('default', jobFactory())
        .then((response) => {
            res.status(200)
            res.json(response)
        })
        .catch((e) => {
            res.status(500)
            res.json(e)
        })
}

module.exports = { simpleJob }
