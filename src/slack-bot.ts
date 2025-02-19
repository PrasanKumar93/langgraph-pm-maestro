import type { InputStateType } from "./agent/state.js";

import slackBoltPkg from "@slack/bolt";
import "dotenv/config";

import { LoggerCls } from "./utils/logger.js";
import { runWorkflow } from "./agent/workflow.js";
import { STEP_EMOJIS } from "./utils/constants.js";

interface IProcessRequest {
  threadTs: string;
  channelId: string;
  text: string;
  say: slackBoltPkg.SayFn;
}

const { App } = slackBoltPkg;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN, //for socket mode
});

const processRequest = async ({
  threadTs,
  channelId,
  text,
  say,
}: IProcessRequest) => {
  await say({
    text: `${STEP_EMOJIS.start} Starting Feature Request Analysis`,
    thread_ts: threadTs,
  });

  const input: InputStateType = {
    inputText: text,
    onNotifyProgress: async (detail: string) => {
      await say({
        text: detail,
        thread_ts: threadTs,
      });
    },
  };

  const result = await runWorkflow(input);
  if (result.error) {
    await say(STEP_EMOJIS.error + " " + result.error);
  } else if (result.outputPRDFilePath) {
    const fileName = result.outputPRDFilePath.split("/").pop();
    try {
      await app.client.files.uploadV2({
        thread_ts: threadTs,
        channel_id: channelId,
        initial_comment:
          STEP_EMOJIS.complete +
          " Here's your Mini Product Requirements Document:",
        file: result.outputPRDFilePath,
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
  } else if (result.messages?.length) {
    //interrupt cases
    const lastMessage = result.messages[result.messages.length - 1];
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

const initSlackBot = async () => {
  // Handle direct messages and channel messages
  app.message(async ({ message, say }) => {
    // Check if this is a direct message
    if (message.channel_type === "im" && "text" in message) {
      const threadTs = message.ts;
      const channelId = message.channel;
      const text = message.text || "";

      await processRequest({ threadTs, channelId, text, say });
    }
  });

  app.event("app_mention", async ({ event, context, client, say }) => {
    const threadTs = event.thread_ts || event.ts;
    const channelId = event.channel;
    const text = event.text;

    await processRequest({ threadTs, channelId, text, say });
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

initSlackBot();
