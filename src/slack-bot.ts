import type { InputStateType } from "./agent/state.js";

import slackBoltPkg from "@slack/bolt";
import "dotenv/config";
import { BaseMessage } from "@langchain/core/messages";

import { LoggerCls } from "./utils/logger.js";
import { runWorkflow } from "./agent/workflow.js";
import { STEP_EMOJIS } from "./utils/constants.js";

interface IProcessRequest {
  threadTs: string;
  channelId: string;
  text: string;
  say: slackBoltPkg.SayFn;
}

interface IUploadFileToSlack {
  threadTs: string;
  channelId: string;
  filePath: string;
  say: slackBoltPkg.SayFn;
}
interface IReplyWithLastMessage {
  messages: BaseMessage[];
  threadTs: string;
  say: slackBoltPkg.SayFn;
}

const { App } = slackBoltPkg;
let slackApp: slackBoltPkg.App<slackBoltPkg.StringIndexed> | null = null;

const getSlackApp = () => {
  if (!slackApp) {
    slackApp = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: true,
      appToken: process.env.SLACK_APP_TOKEN, //for socket mode
    });
  }
  return slackApp;
};

const uploadFileToSlack = async ({
  filePath,
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
        initial_comment:
          STEP_EMOJIS.complete +
          " Here's your Mini Product Requirements Document:",
        file: filePath,
        filename: fileName,
        title: "Mini PRD",
      });
    } catch (error) {
      await say({
        text: STEP_EMOJIS.error + " Error uploading the PDF. Please try again.",
        thread_ts: threadTs,
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
    });
  }
};

const processSlackMessage = async ({
  threadTs,
  channelId,
  text,
  say,
}: IProcessRequest) => {
  //Acknowledge user
  await say({
    text: `${STEP_EMOJIS.start} Starting Feature Request Analysis`,
    thread_ts: threadTs,
  });

  const input: InputStateType = {
    inputText: text,
    onNotifyProgress: async (detail: string) => {
      // Notify user about each step in workflow
      await say({
        text: detail,
        thread_ts: threadTs,
      });
    },
  };

  //Run workflow
  const result = await runWorkflow(input);

  if (result.outputPRDFilePath) {
    //success case
    await uploadFileToSlack({
      filePath: result.outputPRDFilePath,
      threadTs,
      channelId,
      say,
    });
  } else if (result.error) {
    //error case
    await say(STEP_EMOJIS.error + " " + result.error);
  } else if (result.messages?.length) {
    //interrupt (intermediate error) case
    await replyWithLastMessage({
      messages: result.messages,
      threadTs,
      say,
    });
  }
};

const initAndListenSlackBot = async () => {
  const app = getSlackApp();

  // Handle direct messages and channel messages
  app.message(async ({ message, say }) => {
    // Check if this is a direct message
    if (message.channel_type === "im" && "text" in message) {
      const threadTs = message.ts;
      const channelId = message.channel;
      const text = message.text || "";

      await processSlackMessage({ threadTs, channelId, text, say });
    }
  });

  // Handle app mentions
  app.event("app_mention", async ({ event, context, client, say }) => {
    const threadTs = event.thread_ts || event.ts;
    const channelId = event.channel;
    const text = event.text;

    await processSlackMessage({ threadTs, channelId, text, say });
  });

  await app
    .start(process.env.SLACK_BOT_PORT || 8080)
    .then(() => {
      LoggerCls.log("⚡️ Slack bot is running and connected!");
    })
    .catch((error) => {
      LoggerCls.error("Failed to start Slack bot:", error);
    });
};

initAndListenSlackBot();
