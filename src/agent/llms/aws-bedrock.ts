import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { LoggerCls } from "../../utils/logger.js";
import { getConfig } from "../../config.js";

class AwsBedrockCls {
  static getLLM(customModel?: string) {
    let llm: BedrockChat;
    try {
      const config = getConfig();

      llm = new BedrockChat({
        model: customModel || config.AWS_BEDROCK_MODEL_NAME,
        region: config.AWS_REGION,
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
          sessionToken: config.AWS_SESSION_TOKEN,
        },
        modelKwargs: {
          temperature: 0,
        },
        streaming: false,
      });
    } catch (error) {
      LoggerCls.error("Error fetching AWS Bedrock LLM:", error);
      throw error;
    }
    return llm;
  }
}

export { AwsBedrockCls };
