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
  //#region update shared state
  const state = getContextVariable("currentState") as OverallStateType;

  state.systemJiraDataList = await searchJira(input.productFeature);
  state.toolSystemJiraProcessed = true;

  const detail = `Extracted Jira data : ${state.systemJiraDataList.length}`;
  state.messages.push(new SystemMessage(detail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress(STEP_EMOJIS.tool + detail);
  }

  setContextVariable("currentState", state);
  //#endregion

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
