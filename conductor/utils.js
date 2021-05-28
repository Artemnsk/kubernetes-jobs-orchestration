const k8s = require('@kubernetes/client-node')
const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api)
const watch = new k8s.Watch(kc)

// Retry times before marking the job failed.
const BACKOFF_LIMIT = 3

function jobFactory(name, envVars) {
    const job = new k8s.V1Job()
    job.apiVersion = 'batch/v1'
    job.kind = 'Job'

    const metadata = new k8s.V1ObjectMeta()
    metadata.name = name
    job.metadata = metadata

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
    // Pass parameters via env variables into the container.
    container.env = Object.entries(envVars).map(([key, value]) => {
        const envVar = new k8s.V1EnvVar()
        envVar.name = key
        envVar.value = `${value}`
        return envVar
    })
    container.resources = containerResReqs

    const podSpec = new k8s.V1PodSpec()
    podSpec.containers = [container]
    podSpec.restartPolicy = 'Never'

    const template = new k8s.V1PodTemplateSpec()
    template.spec = podSpec

    const jobSpec = new k8s.V1JobSpec()
    jobSpec.template = template
    jobSpec.backoffLimit = BACKOFF_LIMIT

    job.spec = jobSpec

    return job
}

function createAndWatch(name, envVariables) {
    return k8sBatchApi.createNamespacedJob('default', jobFactory(name, envVariables))
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
                                // NB! Sometimes Job can be executed 1 more time than BACKOFF_LIMIT. I had a run with
                                // 3 failed pods and with 4. So it is better to check `conditions`
                                // to determine the current job status.
                                const lastCondition = (job.status.conditions || []).reduce((acc, i) => {
                                    // If transition is done only.
                                    if (i.status !== 'True') {
                                        return acc
                                    }
                                    return acc && acc.lastTransitionTime > i.lastTransitionTime ? acc : i
                                }, undefined)
                                const isOver = lastCondition && ['Failed', 'Complete'].includes(lastCondition.type)
                                if (isOver) {
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
                return text
            })
        })
}

module.exports = { createAndWatch }
