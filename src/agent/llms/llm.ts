import { LLM_PROVIDER } from "../../utils/constants.js";
import { OpenAiCls } from "./open-ai.js";
import { AwsBedrockCls } from "./aws-bedrock.js";
import { getConfig } from "../../config.js";

const getLLM = (llmProvider?: LLM_PROVIDER, customModel?: string) => {
  const config = getConfig();

  if (!llmProvider) {
    llmProvider = config.DEFAULT_LLM_PROVIDER as LLM_PROVIDER;
  }

  if (llmProvider === LLM_PROVIDER.OPENAI) {
    return OpenAiCls.getLLM(customModel);
  } else if (llmProvider === LLM_PROVIDER.AWS_BEDROCK) {
    return AwsBedrockCls.getLLM(customModel);
  } else {
    throw new Error("Invalid LLM provider");
  }
};

export { getLLM, LLM_PROVIDER };
