//NOTE : This is just a sample code for Redis Checkpoint Saver.

import { createClient, type RedisClientOptions } from "redis";
import type { RunnableConfig } from "@langchain/core/runnables";
import {
  BaseCheckpointSaver,
  type Checkpoint,
  type CheckpointListOptions,
  type CheckpointTuple,
  type SerializerProtocol,
  type PendingWrite,
  type CheckpointMetadata,
  CheckpointPendingWrite,
} from "@langchain/langgraph-checkpoint";
import { LoggerCls } from "./logger.js";

export type RedisSaverParams = {
  connectionString: string;
  checkpointPrefix?: string;
  writesPrefix?: string;
  commonPrefix?: string;
  redisOptions?: RedisClientOptions;
  insertRawJson?: boolean; //for local debugging only
};

/**
 * A LangGraph checkpoint saver backed by a Redis database.
 * Stores checkpoints as hashes and pending writes as lists.
 *
 * Usage:
 *   const saver = new RedisCheckpointSaver({ connectionString: 'redis://localhost:6379' });
 */
export class RedisCheckpointSaver extends BaseCheckpointSaver {
  protected client;
  checkpointPrefix = "langgraph:checkpoints:";
  writesPrefix = "langgraph:checkpoint_writes:";
  commonPrefix = "";
  insertRawJson = false;

  constructor(
    {
      connectionString,
      checkpointPrefix,
      writesPrefix,
      commonPrefix,
      redisOptions,
      insertRawJson,
    }: RedisSaverParams,
    serde?: SerializerProtocol
  ) {
    super(serde);
    this.client = createClient({ url: connectionString, ...redisOptions });
    if (commonPrefix) {
      this.commonPrefix = commonPrefix;
    }
    if (checkpointPrefix) {
      this.checkpointPrefix = checkpointPrefix;
    }
    if (writesPrefix) {
      this.writesPrefix = writesPrefix;
    }

    this.checkpointPrefix = `${this.commonPrefix}${this.checkpointPrefix}`;
    this.writesPrefix = `${this.commonPrefix}${this.writesPrefix}`;

    if (insertRawJson) {
      this.insertRawJson = insertRawJson;
    }
  }

  private async ensureConnected() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  private checkpointKey(
    thread_id: string,
    checkpoint_ns: string,
    checkpoint_id: string
  ) {
    return `${this.checkpointPrefix}${thread_id}:${checkpoint_ns}:${checkpoint_id}`;
  }

  private writesKey(
    thread_id: string,
    checkpoint_ns: string,
    checkpoint_id: string
  ) {
    return `${this.writesPrefix}${thread_id}:${checkpoint_ns}:${checkpoint_id}`;
  }

  /**
   * Utility to serialize a value (checkpoint, metadata, or write value) based on insertRawJson flag.
   */
  private serializeValue(value: any): { type: string; value: string } {
    let type: string;
    let serialized: string;
    if (this.insertRawJson) {
      type = "json";
      serialized = JSON.stringify(value);
    } else {
      let result = this.serde.dumpsTyped(value);
      type = result[0];
      // result[1] is Uint8Array, convert to base64 string
      serialized = Buffer.from(result[1]).toString("base64");
    }
    return { type, value: serialized };
  }

  /**
   * Utility to deserialize a value (checkpoint, metadata, or write value) based on type.
   */
  private async deserializeValue(type: string, value: string): Promise<any> {
    let retValue: any;
    if (type === "json") {
      retValue = JSON.parse(value);
    } else {
      retValue = await this.serde.loadsTyped(
        type,
        Buffer.from(value, "base64").toString("utf8")
      );
    }
    return retValue;
  }

  /**
   * Utility to deserialize a pending write entry from Redis.
   */
  private async deserializePendingWrite(
    item: string
  ): Promise<CheckpointPendingWrite> {
    const parsed = JSON.parse(item);
    let pValue;
    if (parsed.type === "json") {
      pValue = JSON.parse(parsed.value);
    } else {
      pValue = await this.serde.loadsTyped(
        parsed.type,
        Buffer.from(parsed.value, "base64").toString("utf8")
      );
    }
    return [parsed.task_id, parsed.channel, pValue] as CheckpointPendingWrite;
  }

  /**
   * Get the latest checkpoint key for a given thread_id and checkpoint_ns by scanning, sorting, and picking the last one.
   */
  private async getLatestCheckpointKey(
    thread_id: string,
    checkpoint_ns: string
  ): Promise<string> {
    let retKey = "";
    const pattern = `${this.checkpointPrefix}${thread_id}:${checkpoint_ns}:*`;
    const keys = await this.client.keys(pattern);
    if (keys.length) {
      const sortedKeys = keys.sort();
      retKey = sortedKeys[sortedKeys.length - 1];
    }
    return retKey;
  }

  /**
   * Retrieves a checkpoint from Redis based on the config.
   */
  async getTuple(config: RunnableConfig) {
    let result: CheckpointTuple | undefined;

    await this.ensureConnected();
    const {
      thread_id,
      checkpoint_ns = "",
      checkpoint_id,
    } = config.configurable ?? {};
    let key: string | undefined;
    if (thread_id) {
      if (checkpoint_id) {
        key = this.checkpointKey(thread_id, checkpoint_ns, checkpoint_id);
      } else {
        key = await this.getLatestCheckpointKey(thread_id, checkpoint_ns);
      }

      if (key) {
        const doc = await this.client.hGetAll(key);
        if (doc?.checkpoint) {
          const configurableValues = {
            thread_id,
            checkpoint_ns,
            checkpoint_id: doc.checkpoint_id,
          };

          const checkpoint = await this.deserializeValue(
            doc.type,
            doc.checkpoint
          );
          const metadata = await this.deserializeValue(doc.type, doc.metadata);

          // Pending writes
          const writesKey = this.writesKey(
            thread_id,
            checkpoint_ns,
            doc.checkpoint_id
          );
          const serializedWrites = await this.client.lRange(writesKey, 0, -1);
          const pendingWrites: CheckpointPendingWrite[] = await Promise.all(
            serializedWrites.map((item) => this.deserializePendingWrite(item))
          );
          result = {
            config: { configurable: configurableValues },
            checkpoint,
            pendingWrites,
            metadata,
            parentConfig: doc.parent_checkpoint_id
              ? {
                  configurable: {
                    thread_id,
                    checkpoint_ns,
                    checkpoint_id: doc.parent_checkpoint_id,
                  },
                }
              : undefined,
          };
        }
      }
    }
    return result;
  }

  /**
   * List checkpoint tuples from Redis for a given config.
   */
  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions
  ): AsyncGenerator<CheckpointTuple> {
    await this.ensureConnected();
    const { limit, before, filter } = options ?? {};
    const thread_id = config?.configurable?.thread_id;
    const checkpoint_ns = config?.configurable?.checkpoint_ns ?? "";
    if (!thread_id) return;
    let pattern = `${this.checkpointPrefix}${thread_id}:${checkpoint_ns}:*`;
    let keys = await this.client.keys(pattern);
    // Optionally filter by before
    const beforeConfigCheckPointId = before?.configurable?.checkpoint_id
      ? before.configurable.checkpoint_id
      : null;
    if (beforeConfigCheckPointId) {
      keys = keys.filter((k) => {
        const parts = k.split(":");
        return parts[parts.length - 1] < beforeConfigCheckPointId;
      });
    }
    // Sort by checkpoint_id descending
    keys.sort((a, b) => (a > b ? -1 : 1));
    if (limit) {
      keys = keys.slice(0, limit);
    }
    for (const key of keys) {
      const doc = await this.client.hGetAll(key);
      if (!doc || !doc.checkpoint) continue;

      const checkpoint = await this.deserializeValue(doc.type, doc.checkpoint);
      const metadata = await this.deserializeValue(doc.type, doc.metadata);

      yield {
        config: {
          configurable: {
            thread_id: doc.thread_id,
            checkpoint_ns: doc.checkpoint_ns,
            checkpoint_id: doc.checkpoint_id,
          },
        },
        checkpoint,
        metadata,
        parentConfig: doc.parent_checkpoint_id
          ? {
              configurable: {
                thread_id: doc.thread_id,
                checkpoint_ns: doc.checkpoint_ns,
                checkpoint_id: doc.parent_checkpoint_id,
              },
            }
          : undefined,
      };
    }
  }

  /**
   * Save a checkpoint to Redis.
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata
  ): Promise<RunnableConfig> {
    await this.ensureConnected();

    // LoggerCls.debug("PUT called", { config, checkpoint, metadata });

    const thread_id = config.configurable?.thread_id;
    const checkpoint_ns = config.configurable?.checkpoint_ns ?? "";
    const checkpoint_id = checkpoint.id;
    if (!thread_id) {
      throw new Error(
        `The provided config must contain a configurable field with a "thread_id" field.`
      );
    }
    const checkpointSerialized = this.serializeValue(checkpoint);
    const metadataSerialized = this.serializeValue(metadata);
    if (checkpointSerialized.type !== metadataSerialized.type) {
      throw new Error("Mismatched checkpoint and metadata types.");
    }
    const key = this.checkpointKey(thread_id, checkpoint_ns, checkpoint_id);

    await this.client.hSet(key, {
      thread_id,
      checkpoint_ns,
      checkpoint_id,
      parent_checkpoint_id: config.configurable?.checkpoint_id ?? "",
      type: checkpointSerialized.type,
      checkpoint: checkpointSerialized.value,
      metadata: metadataSerialized.value,
    });
    return {
      configurable: {
        thread_id,
        checkpoint_ns,
        checkpoint_id,
      },
    };
  }

  /**
   * Save intermediate writes associated with a checkpoint to Redis.
   */
  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string
  ): Promise<void> {
    await this.ensureConnected();
    const thread_id = config.configurable?.thread_id;
    const checkpoint_ns = config.configurable?.checkpoint_ns ?? "";
    const checkpoint_id = config.configurable?.checkpoint_id;

    if (thread_id && checkpoint_ns && checkpoint_id) {
      const writesKey = this.writesKey(thread_id, checkpoint_ns, checkpoint_id);
      // Store each write as a JSON string in a Redis list
      for (let idx = 0; idx < writes.length; idx++) {
        const [channel, value] = writes[idx];
        const serialized = this.serializeValue(value);
        const entry = {
          task_id: taskId,
          channel,
          type: serialized.type,
          value: serialized.value,
          idx,
        };
        await this.client.rPush(writesKey, JSON.stringify(entry));
      }
    } else {
      // No-op: nothing to write if we don't have a full checkpoint context
      //   throw new Error(
      //     `The provided config must contain a configurable field with "thread_id", "checkpoint_ns" and "checkpoint_id" fields.`
      //   );
    }
  }
}
