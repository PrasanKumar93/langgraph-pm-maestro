import slackBoltPkg from "@slack/bolt";
import "dotenv/config";

const { App } = slackBoltPkg;

const initSlackBot = async () => {
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN, //for socket mode
  });

  // Handle direct messages and channel messages
  app.message(async ({ message, say }) => {
    console.log("Received message event:", JSON.stringify(message, null, 2));

    // Check if this is a direct message
    if (message.channel_type === "im") {
      await say("Processing your DM! 🚀");
    }
  });

  app.event("app_mention", async ({ event, context, client, say }) => {
    console.log("Received app mention event:", JSON.stringify(event, null, 2));
    await say(
      "Processing your feature request... I'll get back to you with a PRD shortly! 🚀"
    );
  });

  await app
    .start(process.env.SLACK_BOT_PORT || 8080)
    .then(() => {
      console.log("⚡️ Slack bot is running and connected!");
    })
    .catch((error) => {
      console.error("Failed to start Slack bot:", error);
    });
};

initSlackBot();
