const k8s = require('@kubernetes/client-node')
const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api)
const watch = new k8s.Watch(kc)

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
            let text = `<h3>${Date.now()}: Job has been created.</h3>`
            text += `
                <b>Job details:</b>
                <ul><li>${JSON.stringify(response)}</li></ul>
            `

            const jobName = response.body.metadata.name
            // Resource version is needed to filter out old notifications.
            const resourceVersion = response.body.metadata.resourceVersion
            const namespace = 'default'
            // Start watching for changes.
            let watchRequest
            let watchRequestAborted = false
            // TODO: we may want to use "bookmark"s to ensure we missed no changes in between, or what?
            //  see https://kubernetes.io/docs/reference/using-api/api-concepts/#watch-bookmarks
            return watch.watch(
                `/apis/batch/v1/namespaces/${namespace}/jobs`,
                { resourceVersion },
                (type, job) => {
                    // Apparently, types can be ADDED, DELETED, MODIFIED, BOOKMARK, ERROR.
                    // TODO: I couldn't find this info in docs! Also, we may want to handle ERROR and DELETED.
                    switch (type) {
                        case 'MODIFIED':
                            if (job.metadata.name === jobName) {
                                // Notice that we can not compare resourceVersions to know the change time.
                                // See https://kubernetes.io/docs/reference/using-api/api-concepts/#resource-versions.
                                console.log(`Job "${jobName}" status responded by watcher: `, job.status)
                                // Job Status definition.
                                // https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/job-v1/#JobStatus
                                // TODO: we may also want to stop watching if amount of fails reaches limit.
                                if (job.status.succeeded > 0) {
                                    // Stop watching for changes.
                                    watchRequestAborted = true
                                    watchRequest.abort()
                                }
                            }
                            break
                    }
                },
                (err) => {
                    if (err && !watchRequestAborted) {
                        console.log('Watching is over with error: ', err)
                        return
                    }
                    console.log('Watching is over gracefully.')
                },
            ).then(respondedWatchRequest => {
                watchRequest = respondedWatchRequest
                res.status(200)
                res.send(text)
            })
        })
        .catch((e) => {
            res.status(500)
            res.json(e)
        })
}

module.exports = { simpleJob }
