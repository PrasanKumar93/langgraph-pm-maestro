import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";

async function listAvailableModels() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const models = await openai.models.list();
    console.log("Available Models:");
    models.data.forEach((model) => {
      console.log(`- ${model.id}`);
    });
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

const llmOpenAi = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL_NAME || "gpt-4o", //"gpt-4o-mini"
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

//listAvailableModels();
export { llmOpenAi };
