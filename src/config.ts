import "dotenv/config";

const getConfig = () => {
  return {
    DEFAULT_LLM_PROVIDER: process.env.DEFAULT_LLM_PROVIDER || "openai",

    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL_NAME: process.env.OPENAI_MODEL_NAME || "gpt-4o", //"gpt-4o-mini"

    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
    AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN || "",
    AWS_REGION: process.env.AWS_REGION || "us-east-1",
    AWS_BEDROCK_MODEL_NAME:
      process.env.AWS_BEDROCK_MODEL_NAME ||
      "anthropic.claude-3-5-sonnet-20240620-v1:0",

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

    REDIS_KEYS: {
      ROOT_PREFIX: "pmMaestro:",
      CACHE_PREFIX: "jsonCache:",
      CACHE_TTL: 60 * 60 * 24, // 24 hours in seconds (jsonCache & langCache)
    },

    LANGGRAPH: {
      DEBUG_RAW_JSON: false,
    },
    LANGCACHE: {
      ENABLED: process.env.LANGCACHE_ENABLED || "",
      URL: process.env.LANGCACHE_URL || "http://localhost:8080",
      CACHE_ID: process.env.LANGCACHE_CACHE_ID || "cacheUUID1",
      SIMILARITY_THRESHOLD: 0.2,
    },
  };
};

export { getConfig };
