import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "./llm-open-ai.js";
import { checkErrorToStopWorkflow } from "./error.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getPromptExtractProductFeature } from "./prompts/prompt-extract-product-feature.js";

const initializeState = (state: OverallStateType) => {
  state.productFeature = "";

  state.systemSalesForceDataList = [];
  state.systemJiraDataList = [];
  state.toolSystemSalesForceProcessed = false;
  state.toolSystemJiraProcessed = false;

  state.effortEstimationData = {};

  state.outputProductPRD = "";
  state.outputPRDFilePath = "";
  state.error = "";

  state.competitorList = [];
  state.pendingProcessCompetitorList = [];
  state.competitorFeatureDetailsList = [];
  state.competitorTableMatrix = "";
  state.competitorAnalysisPdfFilePath = "";

  state.toolTavilySearchProcessed = false;
  state.toolTavilySearchData = "";
  state.allTavilySearchDataList = [];
};
const nodeExtractProductFeature = async (state: OverallStateType) => {
  initializeState(state);

  const SYSTEM_PROMPT = getPromptExtractProductFeature(state);

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

    const detail = `productFeature: \`${result.productFeature}\``;
    state.messages.push(new SystemMessage(detail));
    if (state.onNotifyProgress) {
      await state.onNotifyProgress(STEP_EMOJIS.subStep + detail);
    }
  } else if (result.error) {
    state.error = result.error;
  } else {
    state.error = "Could not extract product feature";
  }
  //#endregion

  checkErrorToStopWorkflow(state);
  return state;
};

export { nodeExtractProductFeature };
