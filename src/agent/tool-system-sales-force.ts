import type { OverallStateType } from "./state.js";

import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { z } from "zod";
import { SalesforceST } from "../utils/salesforce.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { LoggerCls } from "../utils/logger.js";
import { addSystemMsg } from "./common.js";
import { getConfig } from "../config.js";

const searchSalesforce = async (productFeature: string, query?: string) => {
  const config = getConfig();

  let result: any[] = [];
  query = query || config.SF_SEARCH_FEATURE_QUERY || "";

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

    await addSystemMsg(
      state,
      `Extracted SalesForce data : ${salesforceData.length}`,
      STEP_EMOJIS.tool
    );
  } catch (err) {
    const errStr = LoggerCls.getPureError(err, true);

    await addSystemMsg(
      state,
      `Salesforce tool execution error: ${errStr}`,
      STEP_EMOJIS.error
    );
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
