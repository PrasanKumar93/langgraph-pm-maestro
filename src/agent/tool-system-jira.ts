import type { OverallStateType } from "./state.js";

import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

import { STEP_EMOJIS } from "../utils/constants.js";
import { JiraST } from "../utils/jira.js";
import { LoggerCls } from "../utils/logger.js";

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

    const detail = `Extracted Jira data : ${state.systemJiraDataList.length}`;
    state.messages.push(new SystemMessage(detail));
    if (state.onNotifyProgress) {
      await state.onNotifyProgress(STEP_EMOJIS.tool + detail);
    }
  } catch (err) {
    err = LoggerCls.getPureError(err);

    state.messages.push(new SystemMessage(`Jira tool execution error: ${err}`));
    if (state.onNotifyProgress) {
      await state.onNotifyProgress(
        `${STEP_EMOJIS.error}Jira tool execution error: ${err}`
      );
    }
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
