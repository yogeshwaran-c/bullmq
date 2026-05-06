import { EventEmitter } from 'events';
import {
  MinimalQueue,
  QueueBaseOptions,
  RedisClient,
  Span,
} from '../interfaces';

import {
  delay,
  DELAY_TIME_5,
  isNotConnectionError,
  isRedisInstance,
  trace,
} from '../utils';
import { createScripts } from '../utils/create-scripts';
import { RedisConnection } from './redis-connection';
import { Job } from './job';
import { KeysMap, QueueKeys } from './queue-keys';
import { Scripts } from './scripts';
import { SpanKind } from '../enums';
import { DatabaseType } from '../types/database-type';

/**
 * Base class for all classes that need to interact with queues.
 * This class is normally not used directly, but extended by the other classes.
 *
 */
export class QueueBase extends EventEmitter implements MinimalQueue {
  toKey: (type: string) => string;
  keys: KeysMap;
  closing: Promise<void> | undefined;

  protected closed = false;
  protected hasBlockingConnection = false;
  protected scripts: Scripts;
  protected connection: RedisConnection;
  public readonly qualifiedName: string;

  /**
   *
   * @param name - The name of the queue.
   * @param opts - Options for the queue.
   * @param Connection - An optional "Connection" class used to instantiate a Connection. This is useful for
   * testing with mockups and/or extending the Connection class and passing an alternate implementation.
   */
  constructor(
    public readonly name: string,
    public opts: QueueBaseOptions = { connection: {} },
    Connection: typeof RedisConnection = RedisConnection,
    hasBlockingConnection = false,
  ) {
    super();

    this.hasBlockingConnection = hasBlockingConnection;
    this.opts = {
      prefix: 'bull',
      ...opts,
    };

    if (!name) {
      throw new Error('Queue name must be provided');
    }

    if (name.includes(':')) {
      throw new Error('Queue name cannot contain :');
    }

    this.connection = new Connection(opts.connection, {
      shared: isRedisInstance(opts.connection),
      blocking: hasBlockingConnection,
      skipVersionCheck: opts.skipVersionCheck,
      skipWaitingForReady: opts.skipWaitingForReady,
    });

    this.connection.on('error', (error: Error) => this.emit('error', error));
    this.connection.on('close', () => {
      if (!this.closing) {
        this.emit('ioredis:close');
      }
    });

    const queueKeys = new QueueKeys(opts.prefix);
    this.qualifiedName = queueKeys.getQueueQualifiedName(name);
    this.keys = queueKeys.getKeys(name);
    this.toKey = (type: string) => queueKeys.toKey(name, type);
    this.createScripts();
  }

  /**
   * Returns a promise that resolves to a redis client. Normally used only by subclasses.
   */
  get client(): Promise<RedisClient> {
    return this.connection.client;
  }

  /**
   * Initializes the `Scripts` bundle bound to this queue's connection and keys.
   * Subclasses can override this hook to swap in a different script
   * implementation (e.g. for a different Redis-compatible backend).
   */
  protected createScripts() {
    this.scripts = createScripts(this);
  }

  /**
   * Returns the version of the Redis instance the client is connected to,
   */
  get redisVersion(): string {
    return this.connection.redisVersion;
  }

  /**
   * Returns the database type of the Redis instance the client is connected to,
   */
  get databaseType(): DatabaseType {
    return this.connection.databaseType;
  }

  /**
   * Helper to easily extend Job class calls.
   */
  protected get Job(): typeof Job {
    return Job;
  }

  /**
   * Emits an event. Normally used by subclasses to emit events.
   *
   * @param event - The emitted event.
   * @param args -
   * @returns
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    try {
      return super.emit(event, ...args);
    } catch (err) {
      try {
        return super.emit('error', err);
      } catch (err) {
        // We give up if the error event also throws an exception.
        console.error(err);
        return false;
      }
    }
  }

  /**
   * Returns a promise that resolves once the underlying Redis connection is
   * ready to accept commands. Useful when callers want to ensure the
   * connection has been established before performing follow-up work.
   */
  waitUntilReady(): Promise<RedisClient> {
    return this.client;
  }

  /**
   * Returns the queue's name encoded as base64. Used to build a
   * connection-friendly client name that is safe across the wire even when
   * the queue name contains characters Redis would otherwise reject.
   */
  protected base64Name(): string {
    return Buffer.from(this.name).toString('base64');
  }

  /**
   * Builds the Redis `CLIENT SETNAME` value used to identify this queue's
   * connection. Format: `<prefix>:<base64(queueName)><suffix>`.
   *
   * @param suffix - An optional suffix appended after the base64 name (used
   *   by subclasses to distinguish blocking vs. non-blocking connections).
   */
  protected clientName(suffix = ''): string {
    const queueNameBase64 = this.base64Name();
    return `${this.opts.prefix}:${queueNameBase64}${suffix}`;
  }

  /**
   *
   * Closes the connection and returns a promise that resolves when the connection is closed.
   */
  async close(): Promise<void> {
    if (!this.closing) {
      this.closing = this.connection.close();
    }
    await this.closing;
    this.closed = true;
  }

  /**
   *
   * Force disconnects a connection.
   */
  disconnect(): Promise<void> {
    return this.connection.disconnect();
  }

  /**
   * Runs an async operation and tolerates Redis connection errors.
   *
   * If `fn` throws a connection-related error (e.g. ECONNREFUSED, IORedis
   * disconnect), the error is swallowed and the method returns `undefined`
   * after waiting `delayInMs` (so the caller can retry on the next tick).
   * Any non-connection error is re-emitted on the queue's `error` event.
   *
   * @param fn - The async operation to run.
   * @param delayInMs - How long to wait after a connection error before
   *   resolving. Set to `0` to skip the delay. Defaults to `DELAY_TIME_5`.
   * @returns The value returned by `fn`, or `undefined` if a connection
   *   error was caught.
   */
  protected async checkConnectionError<T>(
    fn: () => Promise<T>,
    delayInMs = DELAY_TIME_5,
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      if (isNotConnectionError(error as Error)) {
        this.emit('error', <Error>error);
      }

      if (!this.closing && delayInMs) {
        await delay(delayInMs);
      } else {
        return;
      }
    }
  }

  /**
   * Wraps the code with telemetry and provides a span for configuration.
   *
   * @param spanKind - kind of the span: Producer, Consumer, Internal
   * @param operation - operation name (such as add, process, etc)
   * @param destination - destination name (normally the queue name)
   * @param callback - code to wrap with telemetry
   * @param srcPropagationMetadata -
   * @returns
   */
  trace<T>(
    spanKind: SpanKind,
    operation: string,
    destination: string,
    callback: (span?: Span, dstPropagationMetadata?: string) => Promise<T> | T,
    srcPropagationMetadata?: string,
  ) {
    return trace<Promise<T> | T>(
      this.opts.telemetry,
      spanKind,
      this.name,
      operation,
      destination,
      callback,
      srcPropagationMetadata,
    );
  }
}
