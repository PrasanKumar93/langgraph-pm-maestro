import chalk from "chalk";

//  basic console logger
class LoggerCls {
  static getPureError(err: unknown) {
    return JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }

  static basicLog(_chalkInst: any, _message: string, _details?: unknown): void {
    if (_chalkInst && _message) {
      console.log(_chalkInst(_message));
      if (_details) {
        _details = _chalkInst(JSON.stringify(_details, null, 4));
        console.log(_details);
      }
      //other loggers can be added here
    }
  }

  static debug(_message: string, _details?: unknown): void {
    LoggerCls.basicLog(chalk.gray, _message, _details);
  }

  static log(_message: string, _details?: unknown): void {
    LoggerCls.basicLog(chalk.green, _message, _details);
  }

  static info(_message: string, _details?: unknown): void {
    LoggerCls.basicLog(chalk.blue, _message, _details);
  }

  static error(_message: string, _details?: unknown): void {
    LoggerCls.basicLog(chalk.red, _message, _details);
  }
}

class CustomErrorCls extends Error {
  userMessage: string;

  constructor(message: string, userMessage?: string) {
    super(message);
    this.userMessage = userMessage || "";
    this.name = "CustomError";
  }
}

export { LoggerCls, CustomErrorCls };
