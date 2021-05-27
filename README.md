# kubernetes-jobs-orchestration
A bunch of samples on how to orchestrate kubernetes jobs.

### Usage

> $ minikube start
>
> $ eval $(minikube docker-env)
>
> $ cd conductor
>
> $ docker build -t conductor .
>
> $ cd ..
>
> $ cd simple-job
>
> $ docker build -t simple-job .
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

#### Create a simple job

**Route:** `GET 127.0.0.1:8080/simple-job?foo=<FOO>`

Where `foo` is just some hypothetical parameter. Behind the scenes, k8s job will be created and
this parameter will be passed to it. You can check this job's pod logs and ensure
that environment variable has been passed fine:
> $ kubectl logs simple-job-\<FOO>-\<HASH>
> 
> \# \<...>
>
> \# Job with foo=\<FOO> is done.

You can also check logs of conductor itself. Once it successfully creates a job, it starts watching
for this particular job changes. Then, once at least one of job's containers succeeded, we aborting
the watcher. Example:
> \# GET 127.0.0.1:8080/simple-job?foo=foo-15
>
> $ kubectl logs conductor
>
> \# Job "simple-job-my-foo-15" status responded by watcher:  { startTime: '2021-05-27T10:39:28Z', active: 1 }
> 
> \# Job "simple-job-my-foo-15" status responded by watcher:  { \<...> succeeded: 1 }
>
> \# Watching is over gracefully. 
