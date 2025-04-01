import type { InputStateType, OverallStateType } from "../agent/state.js";

import slackBoltPkg from "@slack/bolt";
import "dotenv/config";
import { BaseMessage } from "@langchain/core/messages";

import { LoggerCls } from "../utils/logger.js";
import { runWorkflow as runWorkflowPRD } from "../agent/workflow.js";
import { runWorkflow as runWorkflowCompetitiveAnalysis } from "../agent/competitor-matrix/workflow.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getConfig } from "../config.js";

interface IProcessRequest {
  threadTs: string;
  channelId: string;
  text: string;
  say: slackBoltPkg.SayFn;
  workflowType?: WorkFlowTypeEnum;
}
interface ICreateThreadMsgForSlashCommand {
  channelId: string;
  text: string;
  say: slackBoltPkg.SayFn;
}

interface IUploadFileToSlack {
  threadTs: string;
  channelId: string;
  filePath: string;
  fileComment: string;
  fileTitle: string;
  say: slackBoltPkg.SayFn;
}
interface IReplyWithLastMessage {
  messages: BaseMessage[];
  threadTs: string;
  say: slackBoltPkg.SayFn;
}

enum WorkFlowTypeEnum {
  PRD = "prd",
  COMPETITIVE_ANALYSIS = "competitive-analysis",
}

const { App } = slackBoltPkg;
let slackApp: slackBoltPkg.App<slackBoltPkg.StringIndexed> | null = null;

const getSlackApp = () => {
  const config = getConfig();
  if (!slackApp) {
    slackApp = new App({
      token: config.SLACK_BOT_TOKEN,
      signingSecret: config.SLACK_SIGNING_SECRET,
      socketMode: true,
      appToken: config.SLACK_APP_TOKEN, //for socket mode
    });
  }
  return slackApp;
};

const uploadFileToSlack = async ({
  filePath,
  fileComment,
  fileTitle,
  threadTs,
  channelId,
  say,
}: IUploadFileToSlack) => {
  if (filePath) {
    try {
      const fileName = filePath.split("/").pop();
      const app = getSlackApp();

      await app.client.files.uploadV2({
        thread_ts: threadTs,
        channel_id: channelId,
        initial_comment: fileComment,
        file: filePath,
        filename: fileName,
        title: fileTitle,
      });
    } catch (error) {
      await say({
        text: STEP_EMOJIS.error + "Error uploading the PDF. Please try again.",
        thread_ts: threadTs,
        mrkdwn: true,
      });
      LoggerCls.error("Error uploading file:", error);
    }
  }
};

const replyWithLastMessage = async ({
  messages,
  threadTs,
  say,
}: IReplyWithLastMessage) => {
  if (messages?.length) {
    const lastMessage = messages[messages.length - 1];
    const text =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    await say({
      text: text,
      thread_ts: threadTs,
      mrkdwn: true,
    });
  }
};

const processSlackMessage = async ({
  threadTs,
  channelId,
  text,
  say,
  workflowType,
}: IProcessRequest) => {
  if (!workflowType) {
    workflowType = WorkFlowTypeEnum.PRD;
  }

  let startMessage = "";

  if (workflowType === WorkFlowTypeEnum.PRD) {
    startMessage = `Starting feature request analysis for Mini PRD (Product Requirements Document)`;
  } else if (workflowType === WorkFlowTypeEnum.COMPETITIVE_ANALYSIS) {
    startMessage = `Starting feature request analysis for Market Research document`;
  }

  //Acknowledge user
  await say({
    text: `${STEP_EMOJIS.start} ${startMessage}`,
    thread_ts: threadTs,
    mrkdwn: true,
  });

  const input: InputStateType = {
    inputText: text,
    onNotifyProgress: async (detail: string) => {
      // Notify user about each step in workflow
      await say({
        text: detail,
        thread_ts: threadTs,
        mrkdwn: true,
      });
    },
  };

  //Run workflow
  let result: OverallStateType | null = null;

  if (workflowType === WorkFlowTypeEnum.PRD) {
    result = await runWorkflowPRD(input);
  } else if (workflowType === WorkFlowTypeEnum.COMPETITIVE_ANALYSIS) {
    result = await runWorkflowCompetitiveAnalysis(input);
  }

  if (result?.outputPRDFilePath || result?.competitorAnalysisPdfFilePath) {
    //success case
    if (result.outputPRDFilePath) {
      await uploadFileToSlack({
        filePath: result.outputPRDFilePath,
        fileComment:
          STEP_EMOJIS.complete +
          "Here's your Mini Product Requirements Document:",
        fileTitle: "Mini PRD",
        threadTs,
        channelId,
        say,
      });
    }

    if (result.competitorAnalysisPdfFilePath) {
      await uploadFileToSlack({
        filePath: result.competitorAnalysisPdfFilePath,
        fileComment:
          STEP_EMOJIS.complete + "Here's your Market Research Document:",
        fileTitle: "Market Research",
        threadTs,
        channelId,
        say,
      });
    }
  } else if (result?.error) {
    //error case
    await say({
      text: STEP_EMOJIS.error + result.error,
      thread_ts: threadTs,
      mrkdwn: true,
    });
  } else if (result?.messages?.length) {
    //interrupt (intermediate error) case
    await replyWithLastMessage({
      messages: result.messages,
      threadTs,
      say,
    });
  }
};

const createThreadMsgForSlashCommand = async ({
  channelId,
  text,
  say,
}: ICreateThreadMsgForSlashCommand) => {
  //create initial threaded message as slash command disappears
  const initialMessage = await say({
    text: `Processing slash command request for: ${text}`,
    channel: channelId,
  });

  return initialMessage.ts || "";
};

export {
  WorkFlowTypeEnum,
  getSlackApp,
  processSlackMessage,
  createThreadMsgForSlashCommand,
};
