import { BackoffOptions } from '../interfaces/backoff-options';
import { MinimalJob } from '../interfaces/minimal-job';
import { BackoffStrategy } from '../types/backoff-strategy';

/**
 * Map of built-in backoff strategy factories keyed by strategy name.
 *
 * Each factory takes a base `delay` (in milliseconds) and an optional `jitter`
 * value in the range [0, 1] and returns a {@link BackoffStrategy} that, when
 * invoked, computes the next delay to wait before retrying a failed job.
 */
export interface BuiltInStrategies {
  [index: string]: (delay: number, jitter?: number) => BackoffStrategy;
}

/**
 * Provides the built-in backoff strategies used by BullMQ to compute the
 * delay before retrying a failed job, plus helpers to normalize user-supplied
 * backoff options and to invoke a (built-in or custom) strategy.
 */
export class Backoffs {
  /**
   * Built-in backoff strategy factories.
   *
   * - `fixed`: always returns the same `delay`, optionally randomized within
   *   `[delay * (1 - jitter), delay]` when `jitter > 0`.
   * - `exponential`: returns `2^(attemptsMade - 1) * delay`, optionally
   *   randomized within `[maxDelay * (1 - jitter), maxDelay]` when
   *   `jitter > 0`.
   *
   * `jitter` is expected to be a value in `[0, 1]`; when `0` (the default)
   * the strategy is fully deterministic.
   */
  static builtinStrategies: BuiltInStrategies = {
    fixed: function (delay: number, jitter = 0) {
      return function (): number {
        if (jitter > 0) {
          const minDelay = delay * (1 - jitter);

          return Math.floor(Math.random() * delay * jitter + minDelay);
        } else {
          return delay;
        }
      };
    },

    exponential: function (delay: number, jitter = 0) {
      return function (attemptsMade: number): number {
        if (jitter > 0) {
          const maxDelay = Math.round(Math.pow(2, attemptsMade - 1) * delay);
          const minDelay = maxDelay * (1 - jitter);

          return Math.floor(Math.random() * maxDelay * jitter + minDelay);
        } else {
          return Math.round(Math.pow(2, attemptsMade - 1) * delay);
        }
      };
    },
  };

  /**
   * Normalizes a backoff value into a {@link BackoffOptions} object.
   *
   * If a finite number is provided it is treated as a fixed delay in
   * milliseconds and converted to `{ type: 'fixed', delay }`. If a
   * {@link BackoffOptions} object is provided it is returned as-is. Any other
   * falsy value yields `undefined`, indicating no backoff should be applied.
   *
   * @param backoff - A delay in milliseconds or a {@link BackoffOptions} object.
   * @returns The normalized {@link BackoffOptions}, or `undefined` if no backoff
   * should be applied.
   */
  static normalize(
    backoff: number | BackoffOptions,
  ): BackoffOptions | undefined {
    if (Number.isFinite(<number>backoff)) {
      return {
        type: 'fixed',
        delay: <number>backoff,
      };
    } else if (backoff) {
      return <BackoffOptions>backoff;
    }
  }

  /**
   * Computes the next delay (in milliseconds) before a failed job should be
   * retried, by dispatching to the appropriate backoff strategy.
   *
   * Looks up `backoff.type` in {@link Backoffs.builtinStrategies}; if not
   * found, falls back to `customStrategy` when provided, otherwise throws.
   *
   * @param backoff - The backoff options for this job. If falsy, returns `undefined`.
   * @param attemptsMade - The number of attempts already made (1-based).
   * @param err - The error from the most recent failed attempt, passed through
   * to custom strategies for inspection.
   * @param job - The job being retried, passed through to custom strategies.
   * @param customStrategy - Optional user-provided strategy used when
   * `backoff.type` is not a built-in strategy name.
   * @returns The next delay in milliseconds, a Promise resolving to it, or
   * `undefined` when `backoff` is falsy.
   */
  static calculate(
    backoff: BackoffOptions,
    attemptsMade: number,
    err: Error,
    job: MinimalJob,
    customStrategy?: BackoffStrategy,
  ): Promise<number> | number | undefined {
    if (backoff) {
      const strategy = lookupStrategy(backoff, customStrategy);

      return strategy(attemptsMade, backoff.type, err, job);
    }
  }
}

function lookupStrategy(
  backoff: BackoffOptions,
  customStrategy?: BackoffStrategy,
): BackoffStrategy {
  if (backoff.type in Backoffs.builtinStrategies) {
    return Backoffs.builtinStrategies[backoff.type](
      backoff.delay!,
      backoff.jitter,
    );
  } else if (customStrategy) {
    return customStrategy;
  } else {
    throw new Error(
      `Unknown backoff strategy ${backoff.type}.
      If a custom backoff strategy is used, specify it when the queue is created.`,
    );
  }
}
