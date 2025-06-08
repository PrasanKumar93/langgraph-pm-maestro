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
  protected client: ReturnType<typeof createClient>;
  protected checkpointPrefix: string;
  protected writesPrefix: string;
  protected commonPrefix: string;
  protected insertRawJson: boolean;

  constructor(params: RedisSaverParams, serde?: SerializerProtocol) {
    super(serde);
    this.commonPrefix = params.commonPrefix ?? "";
    this.checkpointPrefix = `${this.commonPrefix}${
      params.checkpointPrefix ?? "langgraph:checkpoints:"
    }`;
    this.writesPrefix = `${this.commonPrefix}${
      params.writesPrefix ?? "langgraph:checkpoint_writes:"
    }`;
    this.insertRawJson = params.insertRawJson ?? false;
    this.client = createClient({
      url: params.connectionString,
      ...params.redisOptions,
    });
  }

  /**
   * Ensures the Redis client is connected.
   */
  private async ensureConnected(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  /**
   * Constructs a Redis key for checkpoints.
   */
  private getCheckpointKey(
    threadId: string,
    checkpointNs: string,
    checkpointId: string
  ): string {
    return `${this.checkpointPrefix}${threadId}:${checkpointNs}:${checkpointId}`;
  }

  /**
   * Constructs a Redis key for writes.
   */
  private getWritesKey(
    threadId: string,
    checkpointNs: string,
    checkpointId: string
  ): string {
    return `${this.writesPrefix}${threadId}:${checkpointNs}:${checkpointId}`;
  }

  /**
   * Serializes a value for storage, using either JSON or the provided serializer.
   */
  private serializeValue(value: any) {
    let retItem: { type: string; value: string };
    if (this.insertRawJson) {
      retItem = { type: "json", value: JSON.stringify(value) };
    } else {
      const [type, data] = this.serde.dumpsTyped(value);
      retItem = { type, value: Buffer.from(data).toString("base64") };
    }
    return retItem;
  }

  /**
   * Deserializes a value from storage.
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
   * Deserializes a pending write entry from Redis.
   */
  private async deserializePendingWrite(
    item: string
  ): Promise<CheckpointPendingWrite> {
    const parsed = JSON.parse(item);
    const pValue = await this.deserializeValue(parsed.type, parsed.value);
    return [parsed.task_id, parsed.channel, pValue] as CheckpointPendingWrite;
  }

  /**
   * Gets the latest checkpoint key for a given thread and namespace.
   */
  private async getLatestCheckpointKey(
    threadId: string,
    checkpointNs: string
  ): Promise<string> {
    let retKey = "";
    const pattern = `${this.checkpointPrefix}${threadId}:${checkpointNs}:*`;
    const keys = await this.client.keys(pattern);
    if (keys.length) {
      keys.sort();
      retKey = keys[keys.length - 1];
    }
    return retKey;
  }

  /**
   * Retrieves a checkpoint tuple from Redis based on the config.
   */
  async getTuple(config: RunnableConfig) {
    await this.ensureConnected();

    let result: CheckpointTuple | undefined;
    const {
      thread_id,
      checkpoint_ns = "",
      checkpoint_id,
    } = config.configurable ?? {};
    let key: string | undefined;

    if (thread_id) {
      if (checkpoint_id) {
        key = this.getCheckpointKey(thread_id, checkpoint_ns, checkpoint_id);
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
          const writesKey = this.getWritesKey(
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
   * Lists checkpoint tuples from Redis for a given config.
   */
  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions
  ): AsyncGenerator<CheckpointTuple> {
    await this.ensureConnected();
    const { limit, before } = options ?? {};
    const threadId = config?.configurable?.thread_id;
    const checkpointNs = config?.configurable?.checkpoint_ns ?? "";

    if (!threadId) return;

    let pattern = `${this.checkpointPrefix}${threadId}:${checkpointNs}:*`;
    let keys = await this.client.keys(pattern);
    // Optionally filter by 'before'
    const beforeCheckpointId = before?.configurable?.checkpoint_id ?? null;
    if (beforeCheckpointId) {
      keys = keys.filter((k) => {
        const parts = k.split(":");
        return parts[parts.length - 1] < beforeCheckpointId;
      });
    }
    // Sort by checkpoint_id descending
    keys.sort((a, b) => (a > b ? -1 : 1));
    if (limit) {
      keys = keys.slice(0, limit);
    }
    for (const key of keys) {
      const doc = await this.client.hGetAll(key);
      if (doc && doc.checkpoint) {
        const checkpoint = await this.deserializeValue(
          doc.type,
          doc.checkpoint
        );
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
  }

  /**
   * Saves a checkpoint to Redis.
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata
  ): Promise<RunnableConfig> {
    await this.ensureConnected();
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns ?? "";
    const checkpointId = checkpoint.id;
    if (!threadId) {
      throw new Error(
        `The provided config must contain a configurable field with a thread_id field.`
      );
    }
    const checkpointSerialized = this.serializeValue(checkpoint);
    const metadataSerialized = this.serializeValue(metadata);
    if (checkpointSerialized.type !== metadataSerialized.type) {
      throw new Error("Mismatched checkpoint and metadata types.");
    }
    const key = this.getCheckpointKey(threadId, checkpointNs, checkpointId);
    await this.client.hSet(key, {
      thread_id: threadId,
      checkpoint_ns: checkpointNs,
      checkpoint_id: checkpointId,
      parent_checkpoint_id: config.configurable?.checkpoint_id ?? "",
      type: checkpointSerialized.type,
      checkpoint: checkpointSerialized.value,
      metadata: metadataSerialized.value,
    });
    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpointId,
      },
    };
  }

  /**
   * Saves intermediate writes associated with a checkpoint to Redis.
   */
  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string
  ): Promise<void> {
    await this.ensureConnected();
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns ?? "";
    const checkpointId = config.configurable?.checkpoint_id;
    if (threadId && checkpointNs && checkpointId) {
      const writesKey = this.getWritesKey(threadId, checkpointNs, checkpointId);
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
      // throw new Error(
      //   `The provided config must contain a configurable field with "thread_id", "checkpoint_ns" and "checkpoint_id" fields.`
      // );
    }
  }
}
