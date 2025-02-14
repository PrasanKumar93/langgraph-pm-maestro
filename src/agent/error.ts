import { NodeInterrupt } from "@langchain/langgraph";

import { OverallStateType } from "./state.js";
import { LoggerCls } from "../utils/logger.js";

const checkErrorToStopWorkflow = (state: OverallStateType) => {
  if (state.error) {
    throw new NodeInterrupt(
      "Error encountered in workflow : " + LoggerCls.getPureError(state.error)
    );
  }
};

export { checkErrorToStopWorkflow };
