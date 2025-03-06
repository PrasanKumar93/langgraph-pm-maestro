import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";

import { LoggerCls } from "../../utils/logger.js";
import { getConfig } from "../../config.js";

class OpenAiCls {
  static async getAvailableModels() {
    let retModels: string[] = [];
    try {
      const config = getConfig();

      const openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });

      const models = await openai.models.list();
      LoggerCls.debug("Available Models:");
      models.data.forEach((model) => {
        retModels.push(model.id);
        LoggerCls.debug(`- ${model.id}`);
      });
    } catch (error) {
      LoggerCls.error("Error fetching models:", error);
      throw error;
    }
    return retModels;
  }

  static getLLM(customModel?: string) {
    let llm: ChatOpenAI;
    try {
      const config = getConfig();

      llm = new ChatOpenAI({
        modelName: customModel || config.OPENAI_MODEL_NAME,
        temperature: 0,
        apiKey: config.OPENAI_API_KEY,
      });
    } catch (error) {
      LoggerCls.error("Error fetching LLM:", error);
      throw error;
    }
    return llm;
  }
}

export { OpenAiCls };
