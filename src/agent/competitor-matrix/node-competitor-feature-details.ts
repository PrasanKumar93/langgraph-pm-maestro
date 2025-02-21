import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "../llm-open-ai.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { toolTavilySearch } from "../tool-tavily-search.js";

const getSystemPrompt = (state: OverallStateType) => {
  let competitorName = state.pendingProcessCompetitorList[0];

  const SYSTEM_PROMPT = `
     You are an AI assistant tasked with gathering detailed information about the competitor "${competitorName}".
    Focus on scraping information specifically related to the product feature "${
      state.productFeature
    }".
    Collect all relevant feature details, any ongoing developments, related features, and supporting information from the competitor's website. 
    In future, this information will be used to create a feature and competitor matrix, a summary of competitor offerings, and detailed competitor feature information.
    Convert the gathered information into Markdown format.

    Input:
    - Competitor Name: "${competitorName}"
    - Product Feature: "${state.productFeature}"

    Output:
    - Detailed information in Markdown format, emphasizing relevance to the product feature.
    
    Please ensure the output is clear, well-organized, and focused on the specified feature.

    ---
    Tool Status:
      is toolTavilySearchProcessed: ${
        state.toolTavilySearchProcessed ? "true" : "false"
      }
    
      ${state.toolTavilySearchData}

    ---  
    Note: Do not call tavily search again if it has already been called.
`;
  return SYSTEM_PROMPT;
};

const updateState = async (state: OverallStateType, rawResult: any) => {
  let competitorName = state.pendingProcessCompetitorList[0];

  const detail = `Competitor Feature Details Node executed: ${competitorName}!`;
  state.messages.push(new SystemMessage(detail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress(detail);
  }

  if (state.toolTavilySearchProcessed) {
    // rawResult = string (after tool call)
    if (rawResult) {
      state.competitorFeatureDetailsList.push({
        competitorName: competitorName,
        featureDetails: rawResult,
      });
      state.messages.push(
        new SystemMessage(
          `Competitor ${competitorName} feature details fetched`
        )
      );
    } else {
      state.error = `No data found for competitor ${competitorName}`;
    }

    //remove the processed competitor from the list
    state.pendingProcessCompetitorList.shift();

    if (state.pendingProcessCompetitorList.length === 0) {
      state.messages.push(new SystemMessage("All competitors processed"));
    }

    //reset tool status for next competitor
    state.toolTavilySearchProcessed = false;
    state.toolTavilySearchData = "";
  } else {
    // rawResult = AI Chunk Message (before tool call)
    state.messages.push(rawResult);
  }
};

const nodeCompetitorFeatureDetails = async (state: OverallStateType) => {
  if (state.pendingProcessCompetitorList.length) {
    const SYSTEM_PROMPT = getSystemPrompt(state);

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
