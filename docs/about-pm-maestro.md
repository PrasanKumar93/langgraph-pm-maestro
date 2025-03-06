# PM Maestro

PM Maestro is a demonstration AI agent built with [LangGraph JS](https://langchain-ai.github.io/langgraphjs/) to automate common Product Management tasks. It integrates various technologies—including `Redis` as `checkpointers`, `vector databases` and `LLM cache` for the agent's memory, and more—to showcase how developers can build robust AI-driven workflows for real-world use cases.

## Introduction

In modern software development, Product Managers spend a significant amount of time performing repetitive but critical tasks—collecting customer feedback, researching markets, estimating efforts, and drafting product requirements. LangGraph `PM Maestro` is a proof-of-concept agent that demonstrates how you can automate these tasks using an AI agent. This repository also acts as a practical example of how LangGraph integrates with data stores like `Redis` and advanced features (checkpointers, LLM cache, vector DB, etc.) to build reliable, modular AI workflows.

## Key Features & Workflows

Below are the main workflows this agent can perform. These illustrate the broader capabilities of LangGraph-powered agents and can be adapted for other domains or roles:

### Customer Demand & Feedback Gathering

- Collect information on customer requests from multiple sources (Salesforce, JIRA, .etc).
- Create a summary table of pain-points, features requested, potential deal size, etc.
- Fill information gaps using the LLM’s knowledge when not available in structured sources.

### Market & Competitor Research

- Perform web searches and competitor site scraping for a given product feature.
- Generate a feature matrix comparing different market players.
- Summarize findings in a concise, standardized format (Markdown or table).

### Effort Estimation

- Decompose tasks into actionable items.
- Leverage historical estimates or example data to produce T-shirt sizing in person-months.
- Provide an itemized table detailing individual component effort.

### Mini-PRD Generation

- Drafts a concise 3-4 page Product Requirements Document (PRD) based on existing templates and newly gathered data.
- Includes overview, audience, pain-points, success metrics, competitor analysis, MVP scope, and prioritization.

### Output

- Mini PRD pdf document
- Competitor Analysis pdf document

Note : This agent repository also has slack bot integration.
