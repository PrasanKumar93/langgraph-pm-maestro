import express, { Request, Response } from "express";
import fs from "fs/promises";

import { HTTP_STATUS_CODES } from "./utils/constants.js";
import { LoggerCls } from "./utils/logger.js";
import { generateMiniPrdFile } from "./agent/node-md-to-pdf.js";
import { runWorkflow } from "./agent/workflow.js";
import { seedSalesforce } from "./api/seed-salesforce.js";
import { testSearchSalesforce } from "./api/search-salesforce.js";

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

router.post("/seedSalesforce", async (req: Request, res: Response) => {
  const result: any = {
    data: null,
    error: null,
  };
  try {
    result.data = await seedSalesforce();
  } catch (err) {
    err = LoggerCls.getPureError(err);
    LoggerCls.error("/seedSalesforce API failed !", err);
    result.error = err;
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
  res.send(result);
});

router.post("/testSearchSalesforce", async (req: Request, res: Response) => {
  const result: any = {
    data: null,
    error: null,
  };
  try {
    result.data = await testSearchSalesforce(req.body);
  } catch (err) {
    err = LoggerCls.getPureError(err);
    LoggerCls.error("/testSearchSalesforce API failed !", err);
    result.error = err;
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
  res.send(result);
});

export { router };
