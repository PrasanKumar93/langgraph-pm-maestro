import type { InputStateType } from "./agent/state.js";

import slackBoltPkg from "@slack/bolt";
import "dotenv/config";

import { LoggerCls } from "./utils/logger.js";
import { runWorkflow } from "./agent/workflow.js";

const { App } = slackBoltPkg;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN, //for socket mode
});

const initSlackBot = async () => {
  // Handle direct messages and channel messages
  app.message(async ({ message, say }) => {
    console.log("Received message event:", JSON.stringify(message, null, 2));

    // Check if this is a direct message
    if (message.channel_type === "im") {
      await say("(Test Message) Processing your DM! 🚀");
    }
  });

  app.event("app_mention", async ({ event, context, client, say }) => {
    const threadTs = event.thread_ts || event.ts;

    await say({
      text: "Processing your feature request... I'll get back to you with a Mini PRD shortly! 🚀",
      thread_ts: threadTs,
    });

    const input: InputStateType = {
      inputText: event.text,
      onNotifyProgress: async (detail: string) => {
        await say({
          text: detail,
          thread_ts: threadTs,
        });
      },
    };

    const result = await runWorkflow(input);
    if (result.error) {
      await say(result.error);
    } else if (result.outputPRDFilePath) {
      const fileName = result.outputPRDFilePath.split("/").pop();
      try {
        await app.client.files.uploadV2({
          thread_ts: threadTs,
          channel_id: event.channel,
          initial_comment: "Here's your Mini Product Requirements Document:",
          file: result.outputPRDFilePath,
          filename: fileName,
          title: "Mini PRD",
        });
      } catch (error) {
        await say({
          text: "Error uploading the PDF. Please try again.",
          thread_ts: threadTs,
        });
        LoggerCls.error("Error uploading file:", error);
      }
    }
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
