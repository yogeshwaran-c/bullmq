/**
 * Map of Redis key suffixes to their fully qualified Redis key names for a
 * single queue. Produced by {@link QueueKeys.getKeys}.
 *
 * Keys are the short suffixes used internally (e.g. `'wait'`, `'active'`,
 * `'delayed'`, `''` for the base key); values are the full Redis keys of the
 * form `${prefix}:${queueName}:${suffix}`.
 */
export type KeysMap = { [index in string]: string };

/**
 * Builds the Redis keys that BullMQ uses to store all state for a queue.
 *
 * All keys produced by this class are of the form
 * `${prefix}:${queueName}:${type}`. The class is stateless beyond the
 * configured prefix and is safe to share across queues that use the same
 * prefix.
 *
 * @example
 * const keys = new QueueKeys('bull');
 * keys.toKey('email', 'wait'); // 'bull:email:wait'
 * keys.getQueueQualifiedName('email'); // 'bull:email'
 */
export class QueueKeys {
  /**
   * @param prefix - Redis key prefix shared by every queue managed by this
   * instance. Defaults to `'bull'`.
   */
  constructor(public readonly prefix = 'bull') {}

  /**
   * Returns the full set of Redis keys used by a single queue, keyed by the
   * short suffix BullMQ uses internally (e.g. `'wait'`, `'active'`,
   * `'delayed'`, `''` for the base key).
   *
   * @param name - The queue name.
   * @returns A map from suffix to fully qualified Redis key.
   */
  getKeys(name: string): KeysMap {
    const keys: { [index: string]: string } = {};
    [
      '',
      'active',
      'wait',
      'waiting-children',
      'paused',
      'id',
      'delayed',
      'prioritized',
      'stalled-check',
      'completed',
      'failed',
      'stalled',
      'repeat',
      'limiter',
      'meta',
      'events',
      'pc', // priority counter key
      'marker', // marker key
      'de', // deduplication key
    ].forEach(key => {
      keys[key] = this.toKey(name, key);
    });

    return keys;
  }

  /**
   * Composes a single Redis key for a queue.
   *
   * @param name - The queue name.
   * @param type - The key suffix (e.g. `'wait'`, `'active'`). Pass an empty
   * string to get the queue's base key.
   * @returns The fully qualified Redis key `${prefix}:${name}:${type}`.
   */
  toKey(name: string, type: string): string {
    return `${this.getQueueQualifiedName(name)}:${type}`;
  }

  /**
   * Returns the queue's qualified name (prefix + name) without a key suffix.
   *
   * @param name - The queue name.
   * @returns The string `${prefix}:${name}`.
   */
  getQueueQualifiedName(name: string): string {
    return `${this.prefix}:${name}`;
  }
}
