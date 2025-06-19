# Langcache

- Download the latest repo from internal Google drive/ Github repo, then run the following commands

## Load the Langcache docker image

```sh
docker load -i langcache-docker-image-0.0.8.tar.gz
```

## Run with OpenAI embeddings

```yml title="config.yml"
server:
  port: 8080
metadata:
  loader: static
  caches:
    - id: cacheUUID1
      distance_threshold: 0.2
      urls:
        - "redis://cache-db1:6379"
      index: cacheIndex1
      attributes:
        - "appId"
        - "userId"
        - "userSessionId"
        - "feature"
        - "nodeName"
        - "competitorsListStr"
      model:
        type: openai
        name: text-embedding-3-small
        dimensions: 1536
        key: "ADD OPENAI KEY HERE"
auth:
  disable: true
profile: prod
```

```sh
docker compose up -d langcache-openai
```
