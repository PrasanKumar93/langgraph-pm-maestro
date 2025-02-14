import type { OverallStateType } from "./state.js";

import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

const getSalesForceData = async (
  input: any,
  config: LangGraphRunnableConfig
) => {
  let returnData = [
    {
      customer: "Acme Corporation",
      painPoint:
        "Unable to track user behavior and system performance in real-time",
      featureRequestDetails:
        "Need real-time analytics dashboard to monitor user engagement patterns and system metrics",
      potentialDealSize: "150000",
      industry: "E-commerce",
      priority: "High",
      currentWorkaround: "Running daily batch reports",
      businessImpact:
        "Missing opportunities to optimize user experience and prevent system bottlenecks",
    },
    {
      customer: "TechStart Solutions",
      painPoint:
        "Delayed response to system issues and customer behavior changes",
      featureRequestDetails:
        "Real-time analytics for monitoring API performance and user interaction flows",
      potentialDealSize: "200000",
      industry: "SaaS",
      priority: "Critical",
      currentWorkaround: "Manual monitoring and hourly report generation",
      businessImpact:
        "Customer satisfaction affected by delayed issue detection",
    },
    {
      customer: "Global Retail Inc",
      painPoint:
        "Cannot detect and respond to shopping cart abandonment in real-time",
      featureRequestDetails:
        "Real-time analytics for shopping behavior and immediate intervention capabilities",
      potentialDealSize: "300000",
      industry: "Retail",
      priority: "Medium",
      currentWorkaround: "End-of-day abandonment reports",
      businessImpact:
        "Lost sales opportunities due to delayed customer recovery actions",
    },
  ];

  //#region update shared state
  const state = getContextVariable("currentState") as OverallStateType;

  state.systemSalesForceData = returnData;
  state.toolSystemSalesForceProcessed = true;

  const detail = `SalesForce data fetched`;
  state.messages.push(new SystemMessage(detail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress(detail);
  }

  setContextVariable("currentState", state);
  //#endregion

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

export { toolSystemSalesForce };
