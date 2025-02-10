# LangGraph PM Maestro

## Goals

- Showcase the LangGraph agent’s capability to automate a simple `Product Management` workflow.

- Workflow includes:
  - `Customer Demand Analysis`: Gather and synthesize data from systems like Salesforce, JIRA, Zendesk, etc.
  - `Market Research`: Scrape competitor data, summarize features, and create matrices.
  - `Effort Estimation`: Estimate work required and produce breakdowns.
  - `Mini-PRD Generation`: Generate a multi-page product requirements document.

Note : PRD - Product Requirements Document

## Environment variables

Please set the environment variables in the **.env** file.

```sh title="./.env"
PORT=3001

OPENAI_API_KEY=sk-proj-1234567890
OPENAI_MODEL_NAME=gpt-4o-mini
REDIS_URL=redis://localhost:6379
```

## Install dependencies

```sh
npm install
```

## Start application

```sh
npm start
```
