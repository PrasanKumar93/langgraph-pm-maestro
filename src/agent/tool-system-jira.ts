import type { OverallStateType } from "./state.js";

import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { z } from "zod";

import { STEP_EMOJIS } from "../utils/constants.js";
import { JiraST } from "../utils/jira.js";
import { LoggerCls } from "../utils/logger.js";
import { addSystemMsg } from "./common.js";

const searchJira = async (productFeature: string, query?: string) => {
  let result: any[] = [];
  query = query || process.env.JIRA_JQL_QUERY || "";
  let returnFields = ["id", "key", "summary", "description"]; //, "status"

  if (productFeature && query) {
    const jiraST = JiraST.getInstance();
    result = await jiraST.searchIssues(
      query,
      {
        SEARCH_FIELD: productFeature,
      },
      returnFields
    );

    if (result?.length) {
      result = result.map((item) => {
        return {
          id: item.id,
          key: item.key,
          summary: item.fields.summary,
          description: item.fields.description,
          //          status: item.fields.status,
        };
      });
    }
  } else {
    throw new Error("searchJira() : ProductFeature/ Query is missing");
  }
  return result;
};

const getJiraData = async (input: any, config: LangGraphRunnableConfig) => {
  const state = getContextVariable("currentState") as OverallStateType;

  try {
    const jiraData = await searchJira(input.productFeature);
    if (jiraData?.length > 0) {
      state.systemJiraDataList = jiraData;
    }

    await addSystemMsg(
      state,
      `Extracted Jira data : ${state.systemJiraDataList.length}`,
      STEP_EMOJIS.tool
    );
  } catch (err) {
    err = LoggerCls.getPureError(err);

    await addSystemMsg(
      state,
      `Jira tool execution error: ${err}`,
      STEP_EMOJIS.error
    );
  }
  state.toolSystemJiraProcessed = true;
  setContextVariable("currentState", state);

  return state;
};

const toolSystemJira = tool(
  async (input, config: LangGraphRunnableConfig) =>
    await getJiraData(input, config),
  {
    name: "toolJira",
    description: "Get Jira customer feedback data for a given product feature",
    schema: z.object({
      productFeature: z.string(),
    }),
  }
);

export { toolSystemJira, searchJira };
