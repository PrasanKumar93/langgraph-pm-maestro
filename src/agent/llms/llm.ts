import { LLM_PROVIDER } from "../../utils/constants.js";
import { OpenAiCls } from "./open-ai.js";

const getLLM = (llmProvider?: LLM_PROVIDER, customModel?: string) => {
  if (!llmProvider) {
    llmProvider = LLM_PROVIDER.OPENAI;
  }

  if (llmProvider === LLM_PROVIDER.OPENAI) {
    return OpenAiCls.getLLM(customModel);
  } else {
    throw new Error("Invalid LLM provider");
  }
};

export { getLLM, LLM_PROVIDER };
