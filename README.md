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

Make GET request to `127.0.0.1:8080/simple-job` to have k8s job created.
You can track job via `$ kubectl get jobs` and status of corresponding
containers via `$ kubectl get pods`.
