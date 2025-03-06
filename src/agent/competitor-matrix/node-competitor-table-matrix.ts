import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "../llm-open-ai.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptCompetitorTableMatrix } from "../prompts/prompt-competitor-table-matrix.js";
import { addSystemMsg } from "../common.js";

const updateState = async (state: OverallStateType, resultStr: any) => {
  if (resultStr) {
    await addSystemMsg(
      state,
      "Competitor Table Matrix created",
      STEP_EMOJIS.competitorTable
    );

    state.competitorTableMatrix = resultStr;
  } else {
    state.error = `Failed to create competitor table matrix`;
  }
};

const nodeCompetitorTableMatrix = async (state: OverallStateType) => {
  try {
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
  } catch (err) {
    state.error = err;
  }

  checkErrorToStopWorkflow(state);
  return state;
};

export { nodeCompetitorTableMatrix };
