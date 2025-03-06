# Sample Seeding Jira Data

## Overview

This guide explains how to populate your Jira instance with sample data for testing purposes.

## Prerequisites

- Create a **Jira project** in your account after completing the [Jira account creation](./how-tos/jira.md) and setting up the required environment variables
- Add your project key to the `.env` file:

```sh
JIRA_SEED_PROJECT_KEY="your-project-key"
```

## Available Resources

### API Endpoint

- Use the [seedJira](./apis/seed-jira.md) API to populate sample data

### Data Sources

- Sample data definitions are located in:
  - [`jira-data.ts`](../src/data/jira-data.ts)

## Usage

To populate your Jira instance with sample data, simply call the seedJira API endpoint. This will create test records using the predefined data templates.

## Sample Search query in .env

```sh
JIRA_JQL_QUERY="project = 'CPG' AND textfields ~ 'SEARCH_FIELD' ORDER BY created DESC"
```
