# PM Maestro

PM Maestro is an AI demonstration agent built with [LangGraph JS](https://langchain-ai.github.io/langgraphjs/) to automate common Product Management tasks. It integrates various technologies—including `Redis` for `checkpointers`, `vector databases`, and `LLM cache` for memory management—to showcase how developers can build robust, AI-driven workflows for practical, real-world use cases.

## Introduction

Product Managers often spend significant time on repetitive yet critical tasks, such as gathering customer feedback, conducting market research, estimating efforts, and drafting product requirements. `PM Maestro`, powered by LangGraph JS, demonstrates how these tasks can be automated with AI agents. This repository serves as a practical example illustrating how LangGraph integrates with `Redis` and advanced memory features like checkpointers, LLM caching, and vector databases to build reliable, modular AI workflows.

## Tech stack

- Language : TypeScript (NodeJS)
- Framework : [LangGraph JS](https://langchain-ai.github.io/langgraphjs/) for workflow orchestration
- Database : [Redis](https://redis.io/learn) as `checkpointer` and `LLM cache`
- LLM provider : `OpenAI`
- Search tool : `Tavily` for web search
- Slack bot integration (Optional): Trigger workflows via `Slack`
- Salesforce data integration (Optional): Enhance context with `Salesforce CRM` data
- Jira data integration (Optional): Enhance context with `Jira` data

## Project setup

### Clone the repository

```sh
git clone https://github.com/redis-developer/langgraph-pm-maestro.git
cd langgraph-pm-maestro
```

### Install dependencies

```sh
npm install
```

### Configure environment variables

- Copy the example environment file to create your own configuration:

```sh
cp .env.example .env
```

- Main environment variables to configure:

```sh title=".env"
# OpenAI API
OPENAI_API_KEY=""
OPENAI_MODEL_NAME="gpt-4o-mini"

# Tavily Search API
TAVILY_API_KEY=""

# Redis
REDIS_URL=""
```

Note :

- Obtain an `OPENAI_API_KEY` from [OpenAI](https://platform.openai.com/signup)

- Obtain a `TAVILY_API_KEY` from [Tavily](https://tavily.com/)

### Run the application

```sh
npm run dev
```

This launches the agent locally. Open LangGraph Studio in your browser at:

```
https://smith.langchain.com/studio?baseUrl=http://localhost:2024
```

(Test in Chrome browser recommended)

## Workflows

`PM Maestro` supports two main workflows that demonstrate broader LangGraph and Redis capabilities, adaptable to various domains or roles:

**1.Market research workflow**
Performs competitor analysis via web searches and generates a PDF feature matrix comparing market players.

**2. PRD (Product Requirements Document) generation workflow**

Generates a comprehensive PRD based on market research data and system integrations (Jira and Salesforce), detailing MVP scope, effort estimates, technical considerations, and prioritized requirements.

## Market research workflow

The following graph depicts the Market Research workflow:

![Market Research Graph](./images/market-research-graph.png)

Note : `competitorSubgraph` contains additional nodes fetching competitors and feature details.

![Market Research Graph Expanded](./images/market-research-graph-expand.png)

Let's understand each node in the graph:

- `extractProductFeature` : It extracts the product feature from the user's input.

```json
// Sample input: "Create PRD for stored procedures feature"
// Output
{
  "productFeature": "stored procedures"
}
```

- `fetchCompetitorList` : Uses `Tavily` web search to find competitors for the given product feature.

```json
// Output
{
  "competitorList": ["SQL Server", "Oracle", "MySQL", "PostgreSQL"]
}
```

- `fetchCompetitorFeatureDetails` : Retrieves feature details for each competitor using `Tavily` web search.

```json
// Output
{
  "competitorFeatureDetailsList": [
    {
      "competitorName": "SQL Server",
      "featureDetails": "Stored procedures in Microsoft SQL Server are a powerful feature that allows users to encapsulate a group of one or more Transact-SQL (T-SQL) statements into a single callable unit..."
    },
    {
      "competitorName": "Oracle",
      "featureDetails": "Oracle Database provides a robust stored procedures feature that allows developers to encapsulate business logic within the database. This feature enhances performance, security, and code reuse, making it a powerful tool for building maintainable database applications...."
    }
  ]
}
```

- `createCompetitorTableMatrix` : Creates a comparison table about the feature details of the competitors.

- `createCompetitorAnalysisPdf` : Generates the final PDF file with the earlier `competitorFeatureDetails` and `competitorTableMatrix` data.

- ![Execution flow](./images/market-research-graph-run-500.gif)

- Once you run the workflow in langgraph studio, PDF output will be saved in the `./prd-files` directory named `competitor-analysis-<date-time>.pdf`.

Note : Adjust prompts in the `src/agent/prompts/` folder as needed.

## PRD (Product Requirements Document) generation workflow

The following graph depicts the PRD Generation workflow:

- ![PRD Generation Graph](./images/prd-graph.png)
- ![PRD Generation Graph Expanded](./images/prd-graph-expand.png)

Note : `extractProductFeature` and `competitorSubgraph` are the same as in the `Market research workflow`.

Additional nodes explained:

- `customerDemandAnalysis` : Aggregates data from Jira and Salesforce for the given product feature.

- `effortEstimation` : Estimates implementation effort and complexity based on competitor analysis and (optional) customer demand data.

```json
{
  "tshirtSize": {
    "size": "M",
    "personMonths": 4.5, //over all effort
    "rationale": "Medium complexity with existing infrastructure support"
  },
  "components": [
    // sub tasks effort
    {
      "name": "Backend API",
      "description": "Implement REST endpoints for data processing",
      "effortMonths": 2,
      "customerImpact": "Enables real-time data access for FinTech Solutions",
      "technicalComplexity": "Medium"
    }
    //...
  ]
}
```

- `prdGenerationSubgraph` : Generates PRD sections like executive summary, customer analysis, market research, product strategy, implementation strategy, etc.

- `markdownToPdf` : Converts the generated PRD markdown to a PDF file.

- ![PRD Execution flow](./images/prd-graph-run-500.gif)

- Once you run the workflow in langgraph studio, PDF output will be saved in the `./prd-files` directory named `mini-prd-<date-time>.pdf`.

Note : Adjust prompts in the `src/agent/prompts/` folder as needed.

## Salesforce Integration (optional)

Sign up at [salesforce](https://developer.salesforce.com/signup) to get `SF_USERNAME` and `SF_PASSWORD` keys. You can get `SF_SECURITY_TOKEN` from `Settings -> Personal Information -> Reset Security Token`.

Set up the following environment variables:

```sh
# ==============================================
# SALESFORCE CONFIGURATION
# ==============================================
SF_USERNAME="your login username"
SF_PASSWORD="your login password"
SF_SECURITY_TOKEN="your security token"
SF_LOGIN_URL="https://login.salesforce.com"
# Sample Search Query - SEARCH_FIELD will be automatically replaced with requested feature
SF_SEARCH_FEATURE_QUERY="FIND {SEARCH_FIELD} IN ALL FIELDS RETURNING TechnicalRequest(Id, Name, painPoint, featureRequestDetails, potentialDealSize, industry, priority, currentWorkaround, businessImpact)"
```

Note : Modify the `SF_SEARCH_FEATURE_QUERY` query to suit your Salesforce org and object structure

## Jira Integration (optional)

Sign up for an [Atlassian account](https://id.atlassian.com/signup) and create a JIRA Cloud instance for development. Generate an API token from your Atlassian profile (under Security settings).

Set up the following environment variables:

```sh
# signed up profile
JIRA_BASE_URL=https://yourdomain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your_api_token
# Sample JQL Query - SEARCH_FIELD will be automatically replaced with requested feature
JIRA_JQL_QUERY="project = 'CPG' AND textfields ~ 'SEARCH_FIELD' ORDER BY created DESC"
```

Note : Modify the `JIRA_JQL_QUERY` query to suit your JIRA project and object structure

## Slack Bot Integration

Follow the steps in [Slack integration guide](https://github.com/redis-developer/langgraph-pm-maestro/blob/main/docs/how-tos/slack.md) to create a Slack app.

```sh title=".env"
SLACK_SIGNING_SECRET="your signing secret"
SLACK_BOT_TOKEN="your bot token"
SLACK_APP_TOKEN="your app token"
SLACK_BOT_PORT=8080
```

Once you have the environment variables set up, you can run the Slack bot locally using `npm run slack-bot` and test it in your Slack workspace.

```sh
npm run start-slack-bot
# (console output) ⚡️ Slack bot is running and connected!
```

We have two Slack commands in the bot to trigger each workflow:

- `/pm-market-research` : runs the market research workflow
- `/pm-prd` : runs the PRD generation workflow

- Go to your Slack workspace and test with a message `/pm-market-research stored procedures feature` or `/pm-prd stored procedures feature`

- You will see the output (intermediate messages and final file) in the channel.

![Market Research Slack](./images/market-research-slack-run-500.gif)

## Checkpointer (Short-term memory)

LangGraph uses a checkpointer to provide short-term memory for the agent, enabling it to persist and recover workflow state. In this demo, Redis is used as the checkpointer, ensuring reliability and resilience in workflow execution.

Below is the screenshot of checkpointer data in [Redis Insight](https://redis.io/insight/)

![Redis Checkpointer](./images/redis-insight-checkpointer.png)

## Cache (Semantic and JSON cache)

Caching is used to `speed up` repeated queries and `reduce costs`. When you rerun a workflow, cached responses are retrieved from Redis, avoiding redundant LLM calls and improving performance.

- **Semantic Cache (Redis Langcache):**

  - Uses vector embeddings (e.g., OpenAI embeddings) to store and retrieve cache entries based on semantic similarity, not just exact text matches.
  - When a new prompt is processed, its embedding is compared to cached entries; if a similar enough entry exists (within a configurable similarity threshold), the cached response is reused.
  - This allows the cache to return relevant results even if the prompt wording changes, as long as the meaning is similar.
  - Redis Langcache is a service that manages embeddings, similarity search, and metadata in Redis.
  - Best for use cases where prompts may be phrased differently but have the same intent.

- **JSON Cache:**
  - Stores and retrieves cache entries using exact matches on prompt text and associated metadata (like feature, node name, user, etc.).
  - Uses Redis JSON search for fast lookup.
  - Only returns a cached result if the prompt and metadata match exactly—no semantic similarity is considered.
  - Simpler and faster for exact-repeat queries, but less flexible for natural language variations. Useful when your agent's node inputs are not dynamic.

| Feature       | Semantic Cache (Langcache)    | JSON Cache                     |
| ------------- | ----------------------------- | ------------------------------ |
| Matching      | Semantic (vector similarity)  | Exact (text + metadata)        |
| Backing Store | Langcache service + Redis     | Redis (JSON)                   |
| Use Case      | Flexible, paraphrased prompts | Identical prompts/ inputs only |
| Setup         | Requires Langcache service    | Redis only                     |

Below is the screenshot of cache data in [Redis Insight](https://redis.io/insight/)

![Redis Cache](./images/redis-insight-cache.png)

## Conclusion

PM Maestro demonstrates the practical power of combining LangGraph JS, Redis, and modern AI techniques, enabling efficient and robust Product Management workflows. Customize and expand these workflows to fit your needs.

## Resources

- [Redis Langgraph checkpointer and store](https://github.com/redis-developer/langgraph-redis) (Python)
- [Try Redis Cloud](https://redis.io/try-free/) for free
- [Redis YouTube channel](https://www.youtube.com/c/Redisinc)
- [Redis Insight](https://redis.io/insight/) is a tool to visualize your Redis data or to play with raw Redis commands in the workbench
