import type { OverallStateType } from "./state.js";

import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { SalesforceST } from "../utils/salesforce.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { LoggerCls } from "../utils/logger.js";

const searchSalesforce = async (productFeature: string, query?: string) => {
  let result: any[] = [];
  query = query || process.env.SF_SEARCH_FEATURE_QUERY || "";

  if (productFeature && query) {
    const salesforceST = SalesforceST.getInstance();
    result = await salesforceST.runSearchQuery(query, {
      SEARCH_FIELD: productFeature,
    });
  } else {
    throw new Error("searchSalesforce() : ProductFeature/ Query is missing");
  }
  return result;
};

const getSalesForceData = async (
  input: any,
  config: LangGraphRunnableConfig
) => {
  const state = getContextVariable("currentState") as OverallStateType;

  try {
    const salesforceData = await searchSalesforce(input.productFeature);

    if (salesforceData?.length > 0) {
      state.systemSalesForceDataList = salesforceData;
    }

    const detail = `Extracted SalesForce data : ${salesforceData.length}`;
    state.messages.push(new SystemMessage(detail));
    if (state.onNotifyProgress) {
      await state.onNotifyProgress(STEP_EMOJIS.tool + detail);
    }
  } catch (err) {
    err = LoggerCls.getPureError(err);

    state.messages.push(
      new SystemMessage(`Salesforce tool execution error: ${err}`)
    );
    if (state.onNotifyProgress) {
      await state.onNotifyProgress(
        `${STEP_EMOJIS.error}Salesforce tool execution error: ${err}`
      );
    }
  }

  state.toolSystemSalesForceProcessed = true;
  setContextVariable("currentState", state);

  return state;
};

const toolSystemSalesForce = tool(
  async (input, config: LangGraphRunnableConfig) =>
    await getSalesForceData(input, config),
  {
    name: "toolSalesForce",
    description:
      "Get SalesForce customer feedback data for a given product feature",
    schema: z.object({
      productFeature: z.string(),
    }),
  }
);

export { toolSystemSalesForce, searchSalesforce };
