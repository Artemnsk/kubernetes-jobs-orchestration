const k8s = require('@kubernetes/client-node')
const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api)

function jobFactory(foo) {
    const job = new k8s.V1Job()
    job.apiVersion = 'batch/v1'
    job.kind = 'Job'

    const metadata = new k8s.V1ObjectMeta()
    metadata.name = 'simple-job-' + foo
    job.metadata = metadata

    // Pass parameters via env variables into the container.
    const containerEnv = new k8s.V1EnvVar()
    containerEnv.name = 'FOO'
    containerEnv.value = foo

    // It is something that can vary.
    const containerResReqs = new k8s.V1ResourceRequirements()
    containerResReqs.limits = {
        memory: '64Mi',
        cpu: '100m',
    }

    const container = new k8s.V1Container()
    container.name = 'simple-job'
    container.image = 'simple-job'
    container.imagePullPolicy = 'Never'
    container.env = [containerEnv]
    container.resources = containerResReqs

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
    const foo = req.query.foo
    if (!foo) {
        res.status(404)
        res.send('"foo" parameter is required')
        return
    }

    k8sBatchApi.createNamespacedJob('default', jobFactory(foo))
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
