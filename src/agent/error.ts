import { NodeInterrupt } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";

import { OverallStateType } from "./state.js";
import { LoggerCls } from "../utils/logger.js";
import { STEP_EMOJIS } from "../utils/constants.js";

const checkErrorToStopWorkflow = (state: OverallStateType) => {
  if (state.error) {
    const errorMsg =
      STEP_EMOJIS.error + "Error: " + LoggerCls.getPureError(state.error);

    state.messages.push(new SystemMessage(errorMsg));
    throw new NodeInterrupt(errorMsg);
  }
};

export { checkErrorToStopWorkflow };
