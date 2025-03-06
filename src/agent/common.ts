import type { OverallStateType } from "./state.js";

import { SystemMessage } from "@langchain/core/messages";

const addSystemMsg = async (
  state: OverallStateType,
  msg: string,
  notifyEmoji?: string,
  notifyMsg?: string
) => {
  if (msg) {
    notifyEmoji = notifyEmoji || "";
    notifyMsg = notifyMsg || msg;

    state.messages.push(new SystemMessage(msg));
    if (state.onNotifyProgress) {
      //slack notification
      await state.onNotifyProgress(notifyEmoji + notifyMsg);
    }
  }
};

export { addSystemMsg };
