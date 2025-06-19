import type { ISemanticCache } from "../../types.js";

import { getConfig } from "../../config.js";
import { JsonCacheWrapperCls } from "./json-cache-wrapper.js";
import { LangcacheWrapperCls } from "./langcache-wrapper.js";

class SemanticCacheFactory {
  private static instance: ISemanticCache | null = null;

  public static async createInstance(): Promise<ISemanticCache> {
    if (!SemanticCacheFactory.instance) {
      const config = getConfig();

      if (config.LANGCACHE.ENABLED == "true") {
        // Use Langcache implementation
        SemanticCacheFactory.instance = await LangcacheWrapperCls.getInstance();
      } else {
        // Use JSON cache implementation
        SemanticCacheFactory.instance = await JsonCacheWrapperCls.getInstance();
      }
    }
    return SemanticCacheFactory.instance;
  }
}

//other cache factory patterns

export { SemanticCacheFactory };
