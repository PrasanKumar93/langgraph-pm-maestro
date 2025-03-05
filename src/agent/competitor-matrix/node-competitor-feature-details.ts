import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "../llm-open-ai.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { toolTavilySearch } from "../tool-tavily-search.js";
import { LoggerCls } from "../../utils/logger.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptCompetitorFeatureDetails } from "../prompts/prompt-competitor-feature-details.js";

const updateState = async (state: OverallStateType, rawResult: any) => {
  let competitorName = state.pendingProcessCompetitorList[0];

  if (state.toolTavilySearchProcessed) {
    // rawResult = string (after tool call)
    if (rawResult) {
      state.competitorFeatureDetailsList.push({
        competitorName: competitorName,
        featureDetails: rawResult,
      });

      const msg =
        STEP_EMOJIS.company +
        `*${competitorName}* : Competitor Feature Details fetched`;
      state.messages.push(new SystemMessage(msg));
      if (state.onNotifyProgress) {
        await state.onNotifyProgress(msg);
      }
      LoggerCls.info(msg); //DEBUG
    } else {
      state.error = `No data found for competitor ${competitorName}`;
    }

    //remove the processed competitor from the list
    state.pendingProcessCompetitorList.shift();

    if (state.pendingProcessCompetitorList.length === 0) {
      const msg2 = STEP_EMOJIS.allCompany + "All competitors processed";
      state.messages.push(new SystemMessage(msg2));
      if (state.onNotifyProgress) {
        await state.onNotifyProgress(msg2);
      }
    }

    //reset tool status for next competitor
    state.toolTavilySearchProcessed = false;
    state.toolTavilySearchData = "";
  } else {
    const detail =
      STEP_EMOJIS.subStep +
      `${competitorName} : Competitor Feature Details Node !`;
    state.messages.push(new SystemMessage(detail));
    // if (state.onNotifyProgress) {
    //   await state.onNotifyProgress(detail);
    // }
    LoggerCls.info(detail); //DEBUG

    // rawResult = AI Chunk Message (before tool call)
    state.messages.push(rawResult);
  }
};

const nodeCompetitorFeatureDetails = async (state: OverallStateType) => {
  if (state.pendingProcessCompetitorList.length) {
    const SYSTEM_PROMPT = getPromptCompetitorFeatureDetails(state);

    const competitorListPrompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT],
    ]);

    const model = llmOpenAi.bindTools([toolTavilySearch]);

    const outputParser = new StringOutputParser();

    let chain: RunnableSequence<any, any> | null = null;

    if (state.toolTavilySearchProcessed) {
      //after tool call
      chain = RunnableSequence.from([
        competitorListPrompt,
        model,
        outputParser,
      ]);
    } else {
      state.toolTavilySearchProcessed = false;
      state.toolTavilySearchData = "";
      //before tool call
      chain = RunnableSequence.from([competitorListPrompt, model]);
    }

    const rawResult = await chain.invoke({
      ...state,
    });

    await updateState(state, rawResult);

    checkErrorToStopWorkflow(state);
  }
  return state;
};

export { nodeCompetitorFeatureDetails };
