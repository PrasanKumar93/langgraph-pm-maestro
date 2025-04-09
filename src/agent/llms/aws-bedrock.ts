import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { LoggerCls } from "../../utils/logger.js";
import { getConfig } from "../../config.js";

class AwsBedrockCls {
  private static instance: BedrockChat | null = null;

  private constructor() {}

  static getLLM(customModel?: string): BedrockChat {
    if (!AwsBedrockCls.instance) {
      try {
        const config = getConfig();

        AwsBedrockCls.instance = new BedrockChat({
          model: customModel || config.AWS_BEDROCK_MODEL_NAME,
          region: config.AWS_REGION,
          // (for local development)
          ...(config.AWS_ACCESS_KEY_ID && {
            credentials: {
              accessKeyId: config.AWS_ACCESS_KEY_ID,
              secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
              sessionToken: config.AWS_SESSION_TOKEN,
            },
          }),
          modelKwargs: {
            temperature: 0.3,
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 8192,
          },
          maxRetries: 3,
          maxConcurrency: 1,
          streaming: false,
        });
      } catch (error) {
        LoggerCls.error("Error fetching AWS Bedrock LLM:", error);
        throw error;
      }
    }
    return AwsBedrockCls.instance;
  }
}

export { AwsBedrockCls };
