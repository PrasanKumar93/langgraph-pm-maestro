import express, { Request, Response } from "express";

import { HTTP_STATUS_CODES } from "./utils/constants.js";
import { LoggerCls } from "./utils/logger.js";

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

export { router };
