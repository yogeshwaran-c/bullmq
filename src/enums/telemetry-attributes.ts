/**
 * Standard span attribute keys used by BullMQ when emitting telemetry.
 *
 * The values follow OpenTelemetry-style dotted naming so they can be
 * forwarded directly into a tracing backend without remapping.
 */
export enum TelemetryAttributes {
  /** Name of the queue the span belongs to. */
  QueueName = 'bullmq.queue.name',
  /** Operation being performed on the queue (e.g. `add`, `process`). */
  QueueOperation = 'bullmq.queue.operation',
  /** Number of jobs being added in a bulk `addBulk` call. */
  BulkCount = 'bullmq.job.bulk.count',
  /** Names of the jobs being added in a bulk `addBulk` call. */
  BulkNames = 'bullmq.job.bulk.names',
  /** Name of the job. */
  JobName = 'bullmq.job.name',
  /** Identifier of the job. */
  JobId = 'bullmq.job.id',
  /** Fully qualified Redis key of the job (`<prefix>:<queue>:<id>`). */
  JobKey = 'bullmq.job.key',
  /** Identifiers of multiple jobs targeted by an operation. */
  JobIds = 'bullmq.job.ids',
  /** Number of attempts already made for the job. */
  JobAttemptsMade = 'bullmq.job.attempts.made',
  /** Deduplication key associated with the job, if any. */
  DeduplicationKey = 'bullmq.job.deduplication.key',
  /** Job options used when adding the job. */
  JobOptions = 'bullmq.job.options',
  /** Reported job progress value. */
  JobProgress = 'bullmq.job.progress',
  /** Drain delay (ms) used by the queue worker. */
  QueueDrainDelay = 'bullmq.queue.drain.delay',
  /** Grace period (ms) used when cleaning the queue. */
  QueueGrace = 'bullmq.queue.grace',
  /** Maximum number of jobs cleaned in a single operation. */
  QueueCleanLimit = 'bullmq.queue.clean.limit',
  /** Rate limit configuration for the queue. */
  QueueRateLimit = 'bullmq.queue.rate.limit',
  /** Job type / state filter applied to a query. */
  JobType = 'bullmq.job.type',
  /** Queue options used at construction time. */
  QueueOptions = 'bullmq.queue.options',
  /** Configured maximum length of the queue's events stream. */
  QueueEventMaxLength = 'bullmq.queue.event.max.length',
  /** Job state(s) targeted by a query. */
  QueueJobsState = 'bullmq.queue.jobs.state',
  /** Worker options used at construction time. */
  WorkerOptions = 'bullmq.worker.options',
  /** Human-readable worker name. */
  WorkerName = 'bullmq.worker.name',
  /** Worker identifier (used for stalled-job tracking and lock ownership). */
  WorkerId = 'bullmq.worker.id',
  /** Rate limit configuration for the worker. */
  WorkerRateLimit = 'bullmq.worker.rate.limit',
  /** Whether the worker was closed without waiting for active jobs to finish. */
  WorkerDoNotWaitActive = 'bullmq.worker.do.not.wait.active',
  /** Whether the worker was force-closed. */
  WorkerForceClose = 'bullmq.worker.force.close',
  /** Stalled-jobs detected during a stalled-check pass. */
  WorkerStalledJobs = 'bullmq.worker.stalled.jobs',
  /** Failed-jobs collected during a stalled-check pass. */
  WorkerFailedJobs = 'bullmq.worker.failed.jobs',
  /** Jobs whose locks were extended during a lock-renewal pass. */
  WorkerJobsToExtendLocks = 'bullmq.worker.jobs.to.extend.locks',
  /**
   * @deprecated Use JobAttemptFinishedTimestamp instead. Will be removed in a future version.
   */
  JobFinishedTimestamp = 'bullmq.job.finished.timestamp',
  /** Timestamp (ms) at which the job's current attempt finished. */
  JobAttemptFinishedTimestamp = 'bullmq.job.attempt_finished_timestamp',
  /** Timestamp (ms) at which the job started being processed. */
  JobProcessedTimestamp = 'bullmq.job.processed.timestamp',
  /** Return value produced by the processor for the job. */
  JobResult = 'bullmq.job.result',
  /** Reason recorded when a job failed. */
  JobFailedReason = 'bullmq.job.failed.reason',
  /** Name of the flow the job belongs to. */
  FlowName = 'bullmq.flow.name',
  /** Identifier of the job scheduler that produced the job. */
  JobSchedulerId = 'bullmq.job.scheduler.id',
  /** Current status of the job. */
  JobStatus = 'bullmq.job.status', // TODO: rename it to 'bullmq.job.state' for consistency
}

/**
 * Standard metric names emitted by BullMQ telemetry.
 *
 * Names follow the same dotted style as {@link TelemetryAttributes} so they
 * can be reported directly to an OpenTelemetry-compatible backend.
 */
export enum MetricNames {
  /** Total jobs in the queue (snapshot, by state). */
  QueueJobsCount = 'bullmq.queue.jobs',
  /** Counter incremented when a job completes successfully. */
  JobsCompleted = 'bullmq.jobs.completed',
  /** Counter incremented when a job fails. */
  JobsFailed = 'bullmq.jobs.failed',
  /** Counter incremented when a job is delayed. */
  JobsDelayed = 'bullmq.jobs.delayed',
  /** Counter incremented when a job is retried. */
  JobsRetried = 'bullmq.jobs.retried',
  /** Counter incremented when a job enters the wait state. */
  JobsWaiting = 'bullmq.jobs.waiting',
  /** Counter incremented when a job enters the waiting-children state. */
  JobsWaitingChildren = 'bullmq.jobs.waiting_children',
  /** Histogram of how long each job took to process. */
  JobDuration = 'bullmq.job.duration',
}

/**
 * Kind of span emitted by BullMQ. Values mirror the OpenTelemetry
 * `SpanKind` enum so the underlying tracer can forward them unchanged.
 */
export enum SpanKind {
  /** Span represents an internal operation (no remote peer). */
  INTERNAL = 0,
  /** Span represents a server handling an inbound request. */
  SERVER = 1,
  /** Span represents an outbound request to another service. */
  CLIENT = 2,
  /** Span represents a job being added to the queue (producer side). */
  PRODUCER = 3,
  /** Span represents a job being picked up by a worker (consumer side). */
  CONSUMER = 4,
}
