# kubernetes-jobs-orchestration
A bunch of samples on how to orchestrate kubernetes jobs.

### Usage
// TODO: execute with the gulp. :grimacing:
> $ minikube start
>
> $ eval $(minikube docker-env)
>
> $ cd conductor
>
> $ docker build -t conductor .
>
> $ cd ../simple-job
>
> $ docker build -t simple-job .
>
> $ cd ../memory-job
>
> $ docker build -t memory-job .
>
> $ cd ..
>
> $ kubectl create -f role-jobs-conductor.yaml
>
> $ kubectl create -f role-binding-conductor.yaml
>
> $ kubectl create -f pod-conductor.yaml
>
> $ kubectl port-forward conductor 8080:8081
##
#### Create a simple job

**Route:** `GET 127.0.0.1:8080/simple-job?foo=<FOO>&fail=<FAIL>`

Where 
- `foo` is just some hypothetical parameter. Behind the scenes, k8s job will be created and
this parameter will be passed to it. You can check this job's pod logs and ensure
that environment variable has been passed fine:
> $ kubectl logs simple-job-\<FOO>-\<HASH>
> 
> \# \<...>
>
> \# Simple Job with foo=\<FOO> is done.

- `fail` is an optional parameter: pass just anything that will be treated as `true` to make
job fail every time. Such way you can see how failed job behaves.

You can also check logs of conductor itself. Once it successfully creates a job, it starts watching
for this particular job changes. Then, once at least one of job's containers succeeded, we aborting
the watcher.
##
##### Example 1
> \# GET 127.0.0.1:8080/simple-job?foo=foo-15
>
> $ kubectl logs conductor
>
> \# Job "simple-job-my-foo-15" status responded by watcher:  { startTime: '2021-05-27T10:39:28Z', active: 1 }
> 
> \# Job "simple-job-my-foo-15" status responded by watcher:  { \<...>, conditions: \<CONDITIONS>, succeeded: 1 }
>
> \# Watching is over gracefully.
>
`CONDITIONS:`
```js
[
    {
        type: 'Complete',
        status: 'True',
        lastProbeTime: '2021-05-27T10:40:28Z',
        lastTransitionTime: '2021-05-27T10:40:28Z'
    }
]
```

##### Example 2
> \# GET 127.0.0.1:8080/simple-job?foo=foo-15&fail=1 (with BACKOFF_LIMIT = 3)
>
> $ kubectl logs conductor
>
> \# Job "simple-job-my-foo-15" status responded by watcher:  { startTime: '2021-05-27T10:39:28Z', active: 1 }
>
> \# Job "simple-job-my-foo-15" status responded by watcher:  { startTime: '2021-05-27T10:39:28Z', active: 1, failed: 1 }
>
> \# Job "simple-job-my-foo-15" status responded by watcher:  { startTime: '2021-05-27T10:39:28Z', active: 1, failed: 2 }
>
> \# Job "simple-job-my-foo-15" status responded by watcher:  { startTime: '2021-05-27T10:39:28Z', active: 1, failed: 3 }
> 
> \# Job "simple-job-my-foo-15" status responded by watcher:  { \<...>, conditions: \<CONDITIONS>, failed: 3 (or 4!) }
>
> \# Watching is over gracefully.
>
`CONDITIONS:`
```js
[
    {
        type: 'Failed',
        status: 'True',
        lastProbeTime: '2021-05-27T10:41:28Z',
        lastTransitionTime: '2021-05-27T10:41:28Z',
        reason: 'BackoffLimitExceeded',
        message: 'Job has reached the specified backoff limit'
    }
]
```
##


In the examples above it is crucial to check `status.conditions` of the Job
because even number of failed pods can be slightly different from the
`BACKOFF_LIMIT` (during different experiments with `BACKOFF_LIMIT = 3`
I had 3 and 4 failed pods until Job has finally got "Failed" status).

#### Create a "memory" job

**Route:** `GET 127.0.0.1:8080/memory-job?foo=<FOO>&reqBytes=<REQ_BYTES>&limBytes=<LIM_BYTES>&allocBytes=<ALLOC_BYTES>`

Where 
- `foo` is needed to distinguish jobs.
- `reqBytes` is the amount of memory to request for Job container.
- `limBytes` is the amount of memory to use as limit for Job container.
- `allocBytes` is the amount of memory to allocate in the "memory" job.

##### Example 1
> \# GET http://127.0.0.1:8080/memory-job?foo=bar3&reqBytes=50000000&limBytes=60000000&allocBytes=80000000
>
> $ kubectl logs conductor
> 
> \# { active: 1 }
>
> \# { active: 1, failed: 1 }
>
> \# { active: 1, failed: 2 }
>
> \# { active: 1, failed: 3 }
>
> \# { active: 1, failed: 4 }
>
> $ kubectl get pods
```
NAME                    READY   STATUS      RESTARTS   AGE
conductor               1/1     Running     0          11m
memory-job-bar4-246dg   0/1     OOMKilled   0          66s
memory-job-bar4-9cpf2   0/1     OOMKilled   0          46s
memory-job-bar4-nxmr4   0/1     OOMKilled   0          89s
memory-job-bar4-stz8w   0/1     OOMKilled   0          102s
```
##### Example 2
> \# GET http://127.0.0.1:8080/memory-job?foo=bar3&reqBytes=50000000&limBytes=150000000&allocBytes=80000000
>
> $ kubectl logs conductor
> 
> \# { active: 1 }
>
> \# { succeeded: 1 }

