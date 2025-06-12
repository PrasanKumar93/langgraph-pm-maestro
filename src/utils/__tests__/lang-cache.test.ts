import { describe, it, expect } from "vitest";
import { LangCacheCls } from "../lang-cache.js";
import { getConfig } from "../../config.js";

const config = getConfig();
const serverURL = config.LANGCACHE.URL;
const cacheId = config.LANGCACHE.CACHE_ID;
const langCache = LangCacheCls.getInstance(serverURL, cacheId);

const attributes = { appId: "langcacheUnitTest" };
const SIMILARITY_THRESHOLD = 0.2;
const TTL_MILLIS = 60 * 1000; //60 seconds

describe("LangCacheCls Integration", () => {
  it("should check health", async () => {
    const result = await langCache.checkHealth();
    expect(result.ok).toBe(true);
  });

  it("should insert, retrieve and delete an entry", async () => {
    const entry = {
      prompt: "integration test prompt",
      response: "integration test response",
      attributes: attributes,
      ttlMillis: TTL_MILLIS,
    };
    const insertResult = await langCache.insertEntry(entry);
    expect(typeof insertResult.entryId).toBe("string");
    expect(insertResult.entryId.length).toBeGreaterThan(0);

    const searchResults = await langCache.getEntries({
      prompt: entry.prompt,
      similarityThreshold: SIMILARITY_THRESHOLD,
      attributes: attributes,
    });
    //    console.log("searchResults", searchResults);

    expect(searchResults.length).toBeGreaterThan(0);
    const foundEntry = searchResults[0];
    expect(foundEntry?.id).toBe(insertResult.entryId);

    // Delete the entry
    const deleteResult = await langCache.deleteEntry(insertResult.entryId);
    expect(deleteResult.status).toBeDefined();
  });

  it("should delete entries by attribute", async () => {
    const deleteAttributes = { appId: "bulk-delete-test" };
    // Insert multiple entries
    await langCache.insertEntry({
      prompt: "bulk delete prompt 1",
      response: "bulk delete response 1",
      attributes: deleteAttributes,
      ttlMillis: TTL_MILLIS,
    });
    await langCache.insertEntry({
      prompt: "bulk delete prompt 2",
      response: "bulk delete response 2",
      attributes: deleteAttributes,
      ttlMillis: TTL_MILLIS,
    });

    // Delete all entries with the attribute
    const deleteResult = await langCache.deleteEntries({
      attributes: deleteAttributes,
    });
    expect(deleteResult.deletedEntriesCount).toBe(2);
  });
});
