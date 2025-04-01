import { RedisWrapperST, SchemaFieldTypes } from "../utils/redis.js";
import { LoggerCls } from "../utils/logger.js";
import { getConfig } from "../config.js";

//TODO: temporary file : to be replaced with the lang cache (semantic cache)
interface IAgentCacheData {
  prompt: string;
  response?: string;
  metadata?: {
    [key: string]: string | number | boolean;
  };
  scope: {
    feature: string;
    nodeName: string;
    userId?: string;
    userSessionId?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

class AgentCache {
  private static instance: AgentCache;
  private CACHE_TTL: number;
  private AGENT_CACHE_PREFIX: string;
  private SEARCH_INDEX: string;
  private constructor() {
    const config = getConfig();

    this.CACHE_TTL = config.REDIS_KEYS.CACHE_TTL;
    this.AGENT_CACHE_PREFIX =
      config.REDIS_KEYS.ROOT_PREFIX + config.REDIS_KEYS.CACHE_PREFIX;
    this.SEARCH_INDEX =
      config.REDIS_KEYS.ROOT_PREFIX + "idx:agentCacheSearchIndex";
  }

  public static async getInstance(): Promise<AgentCache> {
    if (!AgentCache.instance) {
      AgentCache.instance = new AgentCache();
      await AgentCache.instance.createIndexIfNotExists();
    }
    return AgentCache.instance;
  }

  public async createIndexIfNotExists() {
    /**
     "FT.CREATE" "pmMaestro2:idx:agentCacheSearchIndex" "ON" "JSON" "PREFIX" "1" "pmMaestro2:agentCache:" "SCHEMA" "$.prompt" "AS" "prompt" "TEXT" "NOSTEM" "SORTABLE" "$.scope.feature" "AS" "scope_feature" "TAG" "$.scope.nodeName" "AS" "scope_nodeName" "TAG" "$.scope.userId" "AS" "scope_userId" "TAG" "$.scope.userSessionId" "AS" "scope_userSessionId" "TAG"
     */
    const redisWrapperST = await RedisWrapperST.getAutoInstance();
    let indexExists = false;

    try {
      await redisWrapperST.client?.ft.info(this.SEARCH_INDEX);
      indexExists = true;
    } catch (error) {
      indexExists = false;
    }

    if (!indexExists) {
      const schema: Record<string, any> = {
        "$.prompt": {
          type: SchemaFieldTypes.TEXT,
          NOSTEM: true,
          SORTABLE: true,
          AS: "prompt",
        },
        "$.scope.feature": {
          type: SchemaFieldTypes.TAG,
          AS: "scope_feature",
        },
        "$.scope.nodeName": {
          type: SchemaFieldTypes.TAG,
          AS: "scope_nodeName",
        },
        "$.scope.userId": {
          type: SchemaFieldTypes.TAG,
          AS: "scope_userId",
        },
        "$.scope.userSessionId": {
          type: SchemaFieldTypes.TAG,
          AS: "scope_userSessionId",
        },
      };
      await redisWrapperST.client?.ft.create(this.SEARCH_INDEX, schema, {
        ON: "JSON",
        PREFIX: this.AGENT_CACHE_PREFIX,
      });
      LoggerCls.debug(`Created search index: ${this.SEARCH_INDEX}`);
    }
  }

  public async setAgentCache(data: IAgentCacheData): Promise<string> {
    let key = "";
    try {
      const redisWrapperST = await RedisWrapperST.getAutoInstance();
      key = crypto.randomUUID().replace(/-/g, "");
      key = this.AGENT_CACHE_PREFIX + key;
      await redisWrapperST.client?.json.set(key, "$", data as any);
      await redisWrapperST.client?.expire(key, this.CACHE_TTL);
    } catch (error) {
      const pureError = LoggerCls.getPureError(error);
      LoggerCls.error("Error in setAgentCache", pureError);
    }
    return key;
  }

  public async getAgentCache(filterData: IAgentCacheData) {
    //TODO: replace json search with semantic search
    let result: IAgentCacheData | null = null;
    try {
      if (filterData.prompt && Object.keys(filterData.scope).length > 0) {
        const redisWrapperST = await RedisWrapperST.getAutoInstance();
        const searchFilters = [];

        //text field
        searchFilters.push(`@prompt:"${filterData.prompt}"`);

        //tag fields
        Object.entries(filterData.scope).forEach(([key, value]) => {
          searchFilters.push(`@scope_${key}:{${value}}`);
        });

        const searchQuery = searchFilters.join(" ");
        const cached = await redisWrapperST.client?.ft.search(
          this.SEARCH_INDEX,
          searchQuery
        );

        if (cached && cached.documents.length > 0) {
          LoggerCls.debug(`Cache hit for query: ${searchQuery}`);
          result = cached.documents[0].value as any;
        } else {
          LoggerCls.debug(`Cache miss for query: ${searchQuery}`);
        }
      }
    } catch (error) {
      const pureError = LoggerCls.getPureError(error);
      LoggerCls.error("Error in getAgentCache", pureError);
    }

    return result;
  }

  public async clearAgentCache(): Promise<void> {
    try {
      const redisWrapperST = await RedisWrapperST.getAutoInstance();
      const pattern = `${this.AGENT_CACHE_PREFIX}*`;

      const keys = await redisWrapperST.getKeys(pattern);
      if (keys && keys.length > 0) {
        await redisWrapperST.client?.del(keys);
        LoggerCls.debug(`Cleared cache for ${pattern}`);
      }
    } catch (error) {
      const pureError = LoggerCls.getPureError(error);
      LoggerCls.error("Error clearing agent cache:", pureError);
    }
  }
}

export { AgentCache };
