import express from "express";
import cors from "cors";
import "dotenv/config";

import { router } from "./routes.js";
import { LoggerCls } from "./utils/logger.js";
import { RedisWrapperST } from "./utils/redis.js";
import { SalesforceST } from "./utils/salesforce.js";

//#region Constants
// process.env.PORT is dynamic port
let PORT = process.env.PORT || process.env.PORT_BACKEND || "3001";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const API_PREFIX = "/api";
//#endregion

const app = express();
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

app.use(API_PREFIX, router);

app.listen(parseInt(PORT), async () => {
  LoggerCls.info(`Server running on port ${PORT}`);
  const redisWrapperST = RedisWrapperST.setInstance(REDIS_URL);
  //await redisWrapperST.connect();

  const salesforceST = SalesforceST.getInstance();
  await salesforceST.login();
});

//#region error handling

const gracefulShutdown = async () => {
  try {
    const redisWrapperST = RedisWrapperST.getInstance();
    await redisWrapperST.disconnect();
    process.exit(0);
  } catch (error) {
    LoggerCls.error(
      "Error during graceful shutdown:",
      LoggerCls.getPureError(error)
    );
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("unhandledRejection", (reason, promise) => {
  LoggerCls.error("Unhandled promise Rejection :", {
    promise: LoggerCls.getPureError(promise),
    reason: LoggerCls.getPureError(reason),
  });
});

process.on("uncaughtException", async (error) => {
  LoggerCls.error("Uncaught Exception:", LoggerCls.getPureError(error));
  await gracefulShutdown();
});
//#endregion
