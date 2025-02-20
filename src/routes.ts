import express, { Request, Response } from "express";
import fs from "fs/promises";

import { HTTP_STATUS_CODES } from "./utils/constants.js";
import { LoggerCls } from "./utils/logger.js";
import { generateMiniPrdFile } from "./agent/node-md-to-pdf.js";
import { runWorkflow } from "./agent/workflow.js";

const router = express.Router();

router.post("/test", async (req: Request, res: Response) => {
  const result: any = {
    data: null,
    error: null,
  };
  const input = req.body;

  try {
    result.data = "Test API";
  } catch (err) {
    err = LoggerCls.getPureError(err);
    LoggerCls.error("/test API failed !", err);
    result.error = err;
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  }

  res.send(result);
});

router.post("/testPdfFile", async (req: Request, res: Response) => {
  const result: any = {
    data: null,
    error: null,
  };
  const input = await fs.readFile("./prd-files/sample-mini-prd.md", "utf8");

  try {
    result.data = await generateMiniPrdFile(input);
  } catch (err) {
    err = LoggerCls.getPureError(err);
    LoggerCls.error("/testPdfFile API failed !", err);
    result.error = err;
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  }

  res.send(result);
});

router.post("/runWorkflow", async (req: Request, res: Response) => {
  const result: any = {
    data: null,
    error: null,
  };
  const input = req.body;
  try {
    result.data = await runWorkflow(input);
  } catch (err) {
    err = LoggerCls.getPureError(err);
    LoggerCls.error("/runWorkflow API failed !", err);
    result.error = err;
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
  res.send(result);
});

export { router };
