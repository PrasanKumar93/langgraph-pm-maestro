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
  redisOptions?: RedisClientOptions;
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

  constructor(
    {
      connectionString,
      checkpointPrefix,
      writesPrefix,
      redisOptions,
    }: RedisSaverParams,
    serde?: SerializerProtocol
  ) {
    super(serde);
    this.client = createClient({ url: connectionString, ...redisOptions });
    if (checkpointPrefix) this.checkpointPrefix = checkpointPrefix;
    if (writesPrefix) this.writesPrefix = writesPrefix;
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
   * Retrieves a checkpoint from Redis based on the config.
   */
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    await this.ensureConnected();
    const {
      thread_id,
      checkpoint_ns = "",
      checkpoint_id,
    } = config.configurable ?? {};
    if (!thread_id) return undefined;
    let key: string;
    if (checkpoint_id) {
      key = this.checkpointKey(thread_id, checkpoint_ns, checkpoint_id);
    } else {
      // Find the latest checkpoint by scanning keys
      const pattern = `${this.checkpointPrefix}${thread_id}:${checkpoint_ns}:*`;
      const keys = await this.client.keys(pattern);
      if (!keys.length) return undefined;
      // Sort by checkpoint_id (assume lexicographical order is sufficient)
      keys.sort();
      key = keys[keys.length - 1];
    }
    const doc = await this.client.hGetAll(key);
    if (!doc || !doc.checkpoint) return undefined;
    const configurableValues = {
      thread_id,
      checkpoint_ns,
      checkpoint_id: doc.checkpoint_id,
    };
    const checkpoint = (await this.serde.loadsTyped(
      doc.type,
      Buffer.from(doc.checkpoint, "base64").toString("utf8")
    )) as Checkpoint;
    // Pending writes
    const writesKey = this.writesKey(
      thread_id,
      checkpoint_ns,
      doc.checkpoint_id
    );
    const serializedWrites = await this.client.lRange(writesKey, 0, -1);
    const pendingWrites: CheckpointPendingWrite[] = await Promise.all(
      serializedWrites.map(async (item) => {
        const parsed = JSON.parse(item);
        return [
          parsed.task_id,
          parsed.channel,
          await this.serde.loadsTyped(
            parsed.type,
            Buffer.from(parsed.value, "base64").toString("utf8")
          ),
        ] as CheckpointPendingWrite;
      })
    );
    return {
      config: { configurable: configurableValues },
      checkpoint,
      pendingWrites,
      metadata: (await this.serde.loadsTyped(
        doc.type,
        Buffer.from(doc.metadata, "base64").toString("utf8")
      )) as CheckpointMetadata,
      parentConfig:
        doc.parent_checkpoint_id != null
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
    const beforeConfig =
      before && before.configurable ? before.configurable : undefined;
    if (beforeConfig && beforeConfig.checkpoint_id) {
      keys = keys.filter((k) => {
        const parts = k.split(":");
        return parts[parts.length - 1] < beforeConfig.checkpoint_id;
      });
    }
    // Sort by checkpoint_id descending
    keys.sort((a, b) => (a > b ? -1 : 1));
    if (limit !== undefined) keys = keys.slice(0, limit);
    for (const key of keys) {
      const doc = await this.client.hGetAll(key);
      if (!doc || !doc.checkpoint) continue;
      const checkpoint = (await this.serde.loadsTyped(
        doc.type,
        Buffer.from(doc.checkpoint, "base64").toString("utf8")
      )) as Checkpoint;
      const metadata = (await this.serde.loadsTyped(
        doc.type,
        Buffer.from(doc.metadata, "base64").toString("utf8")
      )) as CheckpointMetadata;
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

    LoggerCls.debug("PUT called", { config, checkpoint, metadata });

    const thread_id = config.configurable?.thread_id;
    const checkpoint_ns = config.configurable?.checkpoint_ns ?? "";
    const checkpoint_id = checkpoint.id;
    if (thread_id === undefined) {
      throw new Error(
        `The provided config must contain a configurable field with a "thread_id" field.`
      );
    }
    const [checkpointType, serializedCheckpoint] =
      this.serde.dumpsTyped(checkpoint);
    const [metadataType, serializedMetadata] = this.serde.dumpsTyped(metadata);
    if (checkpointType !== metadataType) {
      throw new Error("Mismatched checkpoint and metadata types.");
    }
    const key = this.checkpointKey(thread_id, checkpoint_ns, checkpoint_id);
    await this.client.hSet(key, {
      thread_id,
      checkpoint_ns,
      checkpoint_id,
      parent_checkpoint_id: config.configurable?.checkpoint_id ?? "",
      type: checkpointType,
      checkpoint: Buffer.from(serializedCheckpoint).toString("base64"),
      metadata: Buffer.from(serializedMetadata).toString("base64"),
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
    if (!thread_id || !checkpoint_ns || !checkpoint_id) {
      // No-op: nothing to write if we don't have a full checkpoint context
      return;
      //   throw new Error(
      //     `The provided config must contain a configurable field with "thread_id", "checkpoint_ns" and "checkpoint_id" fields.`
      //   );
    }
    const writesKey = this.writesKey(thread_id, checkpoint_ns, checkpoint_id);
    // Store each write as a JSON string in a Redis list
    for (let idx = 0; idx < writes.length; idx++) {
      const [channel, value] = writes[idx];
      const [type, serializedValue] = this.serde.dumpsTyped(value);
      const entry = {
        task_id: taskId,
        channel,
        type,
        value: Buffer.from(serializedValue).toString("base64"),
        idx,
      };
      await this.client.rPush(writesKey, JSON.stringify(entry));
    }
  }
}
