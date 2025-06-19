import { LangcacheSDK } from "@redis-ai/langcache";
import type {
  SaveCacheEntryRequest,
  CacheSearchRequest,
  DeleteEntriesRequest,
} from "@redis-ai/langcache/models";

class LangcacheCls {
  private static instance: LangcacheCls | null = null;
  private langcacheSDK: LangcacheSDK;
  private cacheId: string;

  private constructor(serverURL: string, cacheId: string) {
    this.langcacheSDK = new LangcacheSDK({
      serverURL: serverURL,
      //debugLogger: console,
      retryConfig: {
        strategy: "backoff",
        // backoff: { //default
        //   initialInterval: 500,
        //   maxInterval: 60000,
        //   exponent: 1.5,
        //   maxElapsedTime: 3600000,
        // },
        retryConnectionErrors: true,
      },
    });
    this.cacheId = cacheId;
  }

  public static getInstance(serverURL: string, cacheId: string): LangcacheCls {
    if (!LangcacheCls.instance) {
      LangcacheCls.instance = new LangcacheCls(serverURL, cacheId);
    }
    return LangcacheCls.instance;
  }

  async checkHealth() {
    const result = await this.langcacheSDK.cacheEntryEndpoints.health({
      cacheId: this.cacheId,
    });
    return result;
  }

  async insertEntry(entry: SaveCacheEntryRequest) {
    const result = await this.langcacheSDK.cacheEntryEndpoints.cache({
      cacheId: this.cacheId,
      saveCacheEntryRequest: {
        prompt: entry.prompt,
        response: entry.response,
        attributes: entry.attributes, //predefined attributes in langcache service
        ttlMillis: entry.ttlMillis,
      },
    });
    return result;
  }

  async getEntries(filter: CacheSearchRequest) {
    const results = await this.langcacheSDK.cacheEntryEndpoints.search({
      cacheId: this.cacheId,
      cacheSearchRequest: {
        prompt: filter.prompt,
        similarityThreshold: filter.similarityThreshold,
        attributes: filter.attributes,
      },
    });
    return results;
  }

  async deleteEntry(entryId: string) {
    const result = await this.langcacheSDK.cacheEntryEndpoints.deleteEntry({
      cacheId: this.cacheId,
      entryId: entryId,
    });
    return result;
  }

  async deleteEntries(filter: DeleteEntriesRequest) {
    const result = await this.langcacheSDK.cacheEntryEndpoints.deleteEntries({
      cacheId: this.cacheId,
      deleteEntriesRequest: {
        attributes: filter.attributes,
      },
    });
    return result;
  }
}

export { LangcacheCls };

/**
// Usage example:
import { LangcacheCls } from './lang-cache.js';
const langCache = LangcacheCls.getInstance('http://localhost:8080', 'cacheUUID1');
await langCache.insertEntry({
  prompt: 'What is AI?',
  response: 'Artificial Intelligence',
  attributes: { appId: 'my-app-id' },
  ttlMillis: 60000
});
 */
