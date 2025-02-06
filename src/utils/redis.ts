import { createClient } from "redis";

import { LoggerCls } from "./logger.js";

type RedisClientType = ReturnType<typeof createClient>;

class RedisWrapper {
  client: RedisClientType | null = null;

  constructor(connectionURL?: string) {
    this.client = createClient({
      url: connectionURL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            // Limit to 3 retry attempts
            return new Error("Retry attempts exhausted.");
          }
          // Retry after ms
          return 10;
        },
      },
    });
    this.client.on("error", (err) => {
      LoggerCls.error("Redis Client Error", err);
    });
  }

  public async connect() {
    await this.client?.connect();
    LoggerCls.info("Connected successfully to Redis !");
  }

  public async disconnect() {
    await this.client?.disconnect();
    LoggerCls.info("Disconnected from Redis.");
  }

  public async set(_key: string, _value: string) {
    const result = await this.client?.set(_key, _value);
    return result;
  }

  public async get(_key: string) {
    const result = await this.client?.get(_key);
    return result;
  }

  public async getKeys(_pattern?: string) {
    _pattern = _pattern || "*";
    const result = await this.client?.keys(_pattern);
    return result;
  }
}

// Singleton class to wrap the Redis client
class RedisWrapperST extends RedisWrapper {
  private static instance: RedisWrapperST;

  private constructor(connectionURL?: string) {
    super(connectionURL);
  }

  public static setInstance(connectionURL: string) {
    RedisWrapperST.instance = new RedisWrapperST(connectionURL);
    return RedisWrapperST.instance;
  }

  public static getInstance(): RedisWrapperST {
    return RedisWrapperST.instance;
  }
}

export { RedisWrapper, RedisWrapperST };

/** Example Usage (RedisWrapper)
 
const redisWrapper = new RedisWrapper("redis://localhost:6379");
await redisWrapper.connect(); 
// perform redis operations
await redisWrapper.disconnect();
//--------------------------------

** Example Usage (RedisWrapperST)

// on app start
const redisWrapperST = RedisWrapperST.setInstance("redis://localhost:6379");
await redisWrapperST.connect(); 

// on app usage
const redisWrapperST = RedisWrapperST.getInstance();
await redisWrapperST.set("key", "value");
await redisWrapperST.client.set("key", "value"); // direct access to client 

*/
