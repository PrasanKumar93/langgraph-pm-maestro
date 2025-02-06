import { ChatOpenAI } from "@langchain/openai";

const llmOpenAi = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL_NAME || "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

export { llmOpenAi };
