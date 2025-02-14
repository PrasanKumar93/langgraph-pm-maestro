import type { OverallStateType } from "./state.js";

import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

const getJiraData = async (input: any, config: LangGraphRunnableConfig) => {
  let returnData = [
    {
      customer: "DataFlow Systems",
      painPoint: "Lack of real-time monitoring for data pipeline failures",
      featureRequestDetails:
        "Real-time analytics dashboard for monitoring data pipeline health and performance metrics",
      potentialDealSize: "175000",
      industry: "Data Services",
      priority: "Critical",
      currentWorkaround: "Email alerts with 15-minute delay",
      businessImpact:
        "Data delivery delays causing SLA violations and customer dissatisfaction",
    },
    {
      customer: "FinTech Solutions Ltd",
      painPoint: "Unable to detect transaction anomalies in real-time",
      featureRequestDetails:
        "Real-time analytics system for transaction monitoring and fraud detection",
      potentialDealSize: "250000",
      industry: "Financial Services",
      priority: "High",
      currentWorkaround: "Batch processing every 30 minutes",
      businessImpact:
        "Increased risk of financial fraud and delayed response to suspicious activities",
    },
    {
      customer: "HealthCare Connect",
      painPoint: "No real-time visibility into patient monitoring systems",
      featureRequestDetails:
        "Real-time analytics for patient data streams and system health monitoring",
      potentialDealSize: "400000",
      industry: "Healthcare",
      priority: "Critical",
      currentWorkaround: "Periodic manual system checks",
      businessImpact:
        "Delayed response to critical patient care situations and system outages",
    },
  ];

  //#region update shared state
  const state = getContextVariable("currentState") as OverallStateType;

  state.systemJiraData = returnData;
  state.toolSystemJiraProcessed = true;

  const detail = `Jira data fetched`;
  state.messages.push(new SystemMessage(detail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress(detail);
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

export { toolSystemJira };
