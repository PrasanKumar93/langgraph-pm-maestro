import { LangcacheSDK } from "@redis-ai/langcache";
import type {
  SaveCacheEntryRequest,
  CacheSearchRequest,
  DeleteEntriesRequest,
} from "@redis-ai/langcache/models";

class LangCacheCls {
  private static instance: LangCacheCls | null = null;
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

  public static getInstance(serverURL: string, cacheId: string): LangCacheCls {
    if (!LangCacheCls.instance) {
      LangCacheCls.instance = new LangCacheCls(serverURL, cacheId);
    }
    return LangCacheCls.instance;
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

export { LangCacheCls };

/**
// Usage example:
import { LangCacheCls } from './lang-cache.js';
const langCache = LangCacheCls.getInstance('http://localhost:8080', 'cacheUUID1');
await langCache.insertEntry({
  prompt: 'What is AI?',
  response: 'Artificial Intelligence',
  attributes: { appId: 'my-app-id' },
  ttlMillis: 60000
});
 */
