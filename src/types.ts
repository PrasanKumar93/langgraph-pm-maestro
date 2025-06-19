export interface ISemanticCacheData {
  prompt: string;
  response?: string;
  scope: {
    feature?: string;
    nodeName: string;
    userId?: string;
    userSessionId?: string;
    competitorsListStr?: string;
  };
}

export interface ISemanticCache {
  setCache(data: ISemanticCacheData): Promise<string>;
  getCache(filterData: ISemanticCacheData): Promise<ISemanticCacheData | null>;
  clearCache(): Promise<void>;
}
