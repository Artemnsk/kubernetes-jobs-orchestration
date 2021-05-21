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
> $ kubectl create -f pod-conductor.yaml
