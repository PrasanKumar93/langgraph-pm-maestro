import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "../llm-open-ai.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptCompetitorTableMatrix } from "../prompts/prompt-competitor-table-matrix.js";

const updateState = async (state: OverallStateType, resultStr: any) => {
  if (resultStr) {
    const detail =
      STEP_EMOJIS.competitorTable + "Competitor Table Matrix created";
    state.messages.push(new SystemMessage(detail));
    if (state.onNotifyProgress) {
      await state.onNotifyProgress(detail);
    }

    state.competitorTableMatrix = resultStr;
  } else {
    state.error = `Failed to create competitor table matrix`;
  }
};

const nodeCompetitorTableMatrix = async (state: OverallStateType) => {
  const SYSTEM_PROMPT = getPromptCompetitorTableMatrix(state);

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

  const resultStr = await chain.invoke({
    ...state,
  });

  await updateState(state, resultStr);

  checkErrorToStopWorkflow(state);
  return state;
};

export { nodeCompetitorTableMatrix };
