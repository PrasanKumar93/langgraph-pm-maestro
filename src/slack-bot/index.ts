import slackBoltPkg from "@slack/bolt";
import "dotenv/config";

import { LoggerCls } from "../utils/logger.js";
import { getConfig } from "../config.js";

import {
  WorkFlowTypeEnum,
  getSlackApp,
  processSlackMessage,
  createThreadMsgForSlashCommand,
} from "./message-handler.js";

const initAndListenSlackBot = async () => {
  const config = getConfig();
  const app = getSlackApp();

  // Handle direct messages and channel messages
  app.message(async ({ message, say }) => {
    // Check if this is a direct message, and not a slash command
    if (
      message.channel_type === "im" &&
      "text" in message &&
      !message.subtype
    ) {
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

  const handleSlashCommandPrd = async ({
    command,
    ack,
    say,
  }: slackBoltPkg.SlackCommandMiddlewareArgs) => {
    await ack();

    const channelId = command.channel_id;
    const text = command.text;

    const threadTs = await createThreadMsgForSlashCommand({
      channelId,
      text,
      say,
    });

    await processSlackMessage({
      threadTs,
      channelId,
      text,
      say,
    });
  };

  // Handle slash command
  app.command("/pm-prd", handleSlashCommandPrd);
  app.command("/priya-prd", handleSlashCommandPrd);

  const handleSlashCommandMarketResearch = async ({
    command,
    ack,
    say,
  }: slackBoltPkg.SlackCommandMiddlewareArgs) => {
    await ack();
    const channelId = command.channel_id;
    const text = command.text;

    const threadTs = await createThreadMsgForSlashCommand({
      channelId,
      text,
      say,
    });

    await processSlackMessage({
      threadTs,
      channelId,
      text,
      say,
      workflowType: WorkFlowTypeEnum.COMPETITIVE_ANALYSIS,
    });
  };

  // Handle slash command
  app.command("/pm-market-research", handleSlashCommandMarketResearch);
  app.command("/priya-market-research", handleSlashCommandMarketResearch);

  await app
    .start(parseInt(config.SLACK_BOT_PORT))
    .then(() => {
      LoggerCls.log("⚡️ Slack bot is running and connected!");
    })
    .catch((error) => {
      LoggerCls.error("Failed to start Slack bot:", error);
    });
};

initAndListenSlackBot();
