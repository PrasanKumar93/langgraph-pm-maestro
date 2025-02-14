import { NodeInterrupt } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";

import { OverallStateType } from "./state.js";
import { LoggerCls } from "../utils/logger.js";

const checkErrorToStopWorkflow = (state: OverallStateType) => {
  if (state.error) {
    const errorMsg = "Error: " + LoggerCls.getPureError(state.error);

    state.messages.push(new SystemMessage(errorMsg));
    throw new NodeInterrupt(errorMsg);
  }
};

export { checkErrorToStopWorkflow };
