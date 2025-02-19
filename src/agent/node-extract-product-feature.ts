import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "./llm-open-ai.js";
import { checkErrorToStopWorkflow } from "./error.js";

const initializeState = (state: OverallStateType) => {
  state.productFeature = "";
  if (!state.systemSalesForceData) {
    state.systemSalesForceData = [];
  }
  if (!state.systemJiraData) {
    state.systemJiraData = [];
  }
  state.outputProductPRD = "";
  state.outputPRDFilePath = "";
  state.error = "";
};
const nodeExtractProductFeature = async (state: OverallStateType) => {
  initializeState(state);

  const SYSTEM_PROMPT = `You are an experienced product manager specialized in extracting the primary product feature from any given text. Your task is to carefully analyze the input and accurately identify the single core product feature mentioned. This extracted feature will later be used to create a mini Product Requirements Document (PRD).

Instructions:
1. Read the provided input text.
2. Identify the explicit product feature being described. Focus solely on the feature mentioned without adding or modifying any context.
3. Respond strictly in JSON format with two keys: "productFeature" and "error".
4. If a valid product feature is found, return its exact name as a clean, concise string in the "productFeature" field, and set "error" to null.
5. If the input text does not clearly describe a product feature, return:
   - "productFeature": null
   - "error": "Please provide a product feature description to create a mini PRD"

Input text: {inputText}

Response format in YAML style (but return as JSON):

  "productFeature": "<extracted feature or null>",
  "error": "<null or error message>"


Examples:
- Example 1:
  Input text: "We need to implement vector search to help users find similar documents quickly"
  then the productFeature in response is "vector search"

- Example 2:
  Input text: "Please generate a PRD/ Mini PRD for vector search feature"
  then the productFeature in response is "vector search"

IMPORTANT: Do not modify the core concept of the feature. Extract exactly what is mentioned in the input without adding extra context.`;

  const extractProductFeaturePrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi;
  const outputParser = new JsonOutputParser();

  const chain = RunnableSequence.from([
    extractProductFeaturePrompt,
    model,
    outputParser,
  ]);

  const result = await chain.invoke({
    ...state,
  });

  //#region update state
  if (result.productFeature) {
    state.productFeature = result.productFeature;
    const detail = `Input: ${result.productFeature}`;
    state.messages.push(new SystemMessage(detail));
    if (state.onNotifyProgress) {
      await state.onNotifyProgress("-----> " + detail); // sub step
    }
  } else {
    state.error = result.error;
  }
  //#endregion

  checkErrorToStopWorkflow(state);
  return state;
};

export { nodeExtractProductFeature };
