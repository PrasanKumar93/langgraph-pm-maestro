const getConfig = () => {
  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL_NAME: process.env.OPENAI_MODEL_NAME || "gpt-4o", //"gpt-4o-mini"

    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    MAX_COMPETITOR_LIST_COUNT: process.env.MAX_COMPETITOR_LIST_COUNT || "10",

    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

    // process.env.PORT can be dynamic vendor port
    PORT: process.env.PORT || "3001",
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS, //comma separated list of allowed origins

    SF_USERNAME: process.env.SF_USERNAME,
    SF_PASSWORD: process.env.SF_PASSWORD,
    SF_SECURITY_TOKEN: process.env.SF_SECURITY_TOKEN,
    SF_LOGIN_URL: process.env.SF_LOGIN_URL || "https://login.salesforce.com",
    SF_SEARCH_FEATURE_QUERY: process.env.SF_SEARCH_FEATURE_QUERY,

    JIRA_EMAIL: process.env.JIRA_EMAIL,
    JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
    JIRA_BASE_URL: process.env.JIRA_BASE_URL,
    JIRA_JQL_QUERY: process.env.JIRA_JQL_QUERY,
    JIRA_SEED_PROJECT_KEY: process.env.JIRA_SEED_PROJECT_KEY,

    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    SLACK_APP_TOKEN: process.env.SLACK_APP_TOKEN,
    SLACK_BOT_PORT: process.env.SLACK_BOT_PORT || "8080",
  };
};

export { getConfig };
