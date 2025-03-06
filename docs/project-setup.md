# Project Setup Guide

This guide will help you set up and run the LangGraph PM Maestro project locally.

## Clone the Repository

```sh
git clone https://github.com/PrasanKumar93/langgraph-pm-maestro.git
cd langgraph-pm-maestro
```

## Install Dependencies

```sh
npm install
```

## Configure Environment Variables

- Copy the example environment file to create your own configuration:

```sh
cp .env.example .env
```

- Open the `.env` file and provide the necessary credentials
  - **Mandatory fields**
    - `OPENAI_API_KEY` : For LLM provider
    - `REDIS_URL` : For checkpointers, vector DB, LLM cache ..etc
    - `TAVILY_SEARCH_API_KEY` : To search the latest web content for competitor analysis of the requested feature
  - **Optional fields group**
    - SALESFORCE CONFIGURATION : To search the requested feature in Salesforce
    - JIRA CONFIGURATION : To search the requested feature in Jira
    - SLACK CONFIGURATION : To access the agent via slack

### How to generate required env variables

- [OpenAI API Key](./how-tos/openai.md)
- [Tavily API Key](./how-tos/tavily-key.md)
- [Salesforce](./how-tos/salesforce.md)
- [Jira](./how-tos/jira.md)
- [Slack](./how-tos/slack.md)

## Running the application

### Running the agent locally in browser (Langgraph Studio)

```sh
npm run dev
```

- Launches the agent locally and opens the studio interface in your browser at:
  `https://smith.langchain.com/studio?baseUrl=http://localhost:2024` (Test in `chrome` browser)

### Running the Slack Bot

To interact with the agent through Slack:

```sh
npm run start-slack-bot
```

Once running, you can communicate with the bot in your registered Slack channel. The agent will respond to your messages automatically.
