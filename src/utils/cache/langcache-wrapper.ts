import type { ISemanticCache, ISemanticCacheData } from "../../types.js";

import { LangcacheCls } from "./langcache.js";
import { getConfig } from "../../config.js";

const config = getConfig();

class LangcacheWrapperCls implements ISemanticCache {
  private static instance: LangcacheWrapperCls | null = null;
  private langCache: LangcacheCls;

  private constructor(serverURL: string, cacheId: string) {
    this.langCache = LangcacheCls.getInstance(serverURL, cacheId);
  }

  public static async getInstance(): Promise<LangcacheWrapperCls> {
    if (!LangcacheWrapperCls.instance) {
      LangcacheWrapperCls.instance = new LangcacheWrapperCls(
        config.LANGCACHE.URL,
        config.LANGCACHE.CACHE_ID
      );
    }
    return LangcacheWrapperCls.instance;
  }

  public async setCache(data: ISemanticCacheData): Promise<string> {
    const result = await this.langCache.insertEntry({
      prompt: data.prompt,
      response: data.response || "",
      attributes: data.scope,
      ttlMillis: config.REDIS_KEYS.CACHE_TTL * 1000, // Convert seconds to milliseconds
    });
    return result.entryId;
  }

  public async getCache(
    filterData: ISemanticCacheData
  ): Promise<ISemanticCacheData | null> {
    const results = await this.langCache.getEntries({
      prompt: filterData.prompt,
      similarityThreshold: config.LANGCACHE.SIMILARITY_THRESHOLD,
      attributes: filterData.scope,
    });
    let result: ISemanticCacheData | null = null;

    if (results && results.length > 0) {
      const entry = results[0];

      if (entry.distance < config.LANGCACHE.SIMILARITY_THRESHOLD) {
        result = {
          prompt: entry.prompt,
          response: entry.response,
          scope: entry.attributes as ISemanticCacheData["scope"],
        };
      }
    }

    return result;
  }

  public async clearCache(): Promise<void> {
    await this.langCache.deleteEntries({
      attributes: {}, // Delete all entries
    });
  }
}

export { LangcacheWrapperCls };
