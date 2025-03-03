import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "../llm-open-ai.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { STEP_EMOJIS } from "../../utils/constants.js";

const getSystemPrompt = (state: OverallStateType) => {
  const inputStr = state.competitorFeatureDetailsList
    .map((item) => {
      return `
      Competitor Name: 
           ${item.competitorName}

      Feature Details: 
           ${item.featureDetails}

      ------------------------------------------     
      `;
    })
    .join("\n");

  const SYSTEM_PROMPT = `
    You are an AI assistant tasked with creating a feature and competitor matrix.
    Use the detailed information collected from each competitor to create a markdown table that shows a feature and competitor matrix. 
    Ensure that each table contains no more than two competitors to maintain readability in PDF format. 
    If there are more than two competitors, create multiple tables, each with two competitors.
    If there is an odd number of competitors, the last table should contain the remaining single competitor.


    Note: Later, the final tables will be converted to PDF, so ensure the formatting is suitable for PDF conversion.

    Input:
     ${inputStr}

    Output:
    - A provider/feature matrix with no more than two competitors per table.
    - A summary of offerings.
    
    Please ensure the matrix is clear, concise, and well-organized.
`;
  return SYSTEM_PROMPT;
};

const updateState = async (state: OverallStateType, rawResult: any) => {
  if (rawResult) {
    const detail =
      STEP_EMOJIS.competitorTable + "Competitor Table Matrix created";
    state.messages.push(new SystemMessage(detail));
    if (state.onNotifyProgress) {
      await state.onNotifyProgress(detail);
    }

    state.competitorTableMatrix = rawResult;
  } else {
    state.error = `Failed to create competitor table matrix`;
  }
};

const nodeCompetitorTableMatrix = async (state: OverallStateType) => {
  const SYSTEM_PROMPT = getSystemPrompt(state);

  const competitorListPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi;

  const outputParser = new StringOutputParser();

  let chain = RunnableSequence.from([
    competitorListPrompt,
    model,
    outputParser,
  ]);

  const rawResult = await chain.invoke({
    ...state,
  });

  await updateState(state, rawResult);

  checkErrorToStopWorkflow(state);
  return state;
};

export { nodeCompetitorTableMatrix };
