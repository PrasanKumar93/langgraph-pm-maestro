import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { getLLM } from "../llms/llm.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { toolTavilySearch } from "../tool-tavily-search.js";
import { LoggerCls } from "../../utils/logger.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptCompetitorFeatureDetails } from "../prompts/prompt-competitor-feature-details.js";
import { addSystemMsg } from "../common.js";

const updateState = async (state: OverallStateType, rawResult: any) => {
  let competitorName = state.pendingProcessCompetitorList[0];

  if (state.toolTavilySearchProcessed) {
    // rawResult = string (after tool call)
    let resultStr = rawResult;
    if (resultStr) {
      state.competitorFeatureDetailsList.push({
        competitorName: competitorName,
        featureDetails: resultStr,
      });

      const msg = `*${competitorName}* : Competitor Feature Details fetched`;
      await addSystemMsg(state, msg, STEP_EMOJIS.company);
      LoggerCls.debug(msg);
    } else {
      state.error = `No data found for competitor ${competitorName}`;
    }

    //remove the processed competitor from the list
    state.pendingProcessCompetitorList.shift();

    if (state.pendingProcessCompetitorList.length === 0) {
      await addSystemMsg(
        state,
        "All competitors processed",
        STEP_EMOJIS.allCompany
      );
    }

    //reset tool status for next competitor
    state.toolTavilySearchProcessed = false;
    state.toolTavilySearchData = "";
  } else {
    const detail = `${competitorName} : Competitor Feature Details Node !`;
    state.messages.push(new SystemMessage(detail));
    LoggerCls.debug(detail);

    // rawResult = AI Chunk Message (before tool call)
    state.messages.push(rawResult);
  }
};

const nodeCompetitorFeatureDetails = async (state: OverallStateType) => {
  try {
    if (state.pendingProcessCompetitorList.length) {
      const SYSTEM_PROMPT = getPromptCompetitorFeatureDetails(state);

      const competitorListPrompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_PROMPT],
      ]);

      const llm = getLLM();
      const model = llm.bindTools([toolTavilySearch]);

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
    }
  } catch (err) {
    state.error = err;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeCompetitorFeatureDetails };
