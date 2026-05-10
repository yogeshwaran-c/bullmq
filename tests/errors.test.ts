import { describe, it, expect } from 'vitest';
import {
  DELAYED_ERROR,
  DelayedError,
  RATE_LIMIT_ERROR,
  RateLimitError,
  UNRECOVERABLE_ERROR,
  UnrecoverableError,
  WAITING_CHILDREN_ERROR,
  WaitingChildrenError,
  WAITING_ERROR,
  WaitingError,
} from '../src/classes/errors';

describe('error classes', () => {
  describe('DelayedError', () => {
    it('exposes the expected error code constant', () => {
      expect(DELAYED_ERROR).toEqual('bullmq:movedToDelayed');
    });

    it('uses the default message when none is provided', () => {
      const err = new DelayedError();
      expect(err.message).toEqual(DELAYED_ERROR);
    });

    it('uses a custom message when one is provided', () => {
      const err = new DelayedError('custom delayed message');
      expect(err.message).toEqual('custom delayed message');
    });

    it('sets the name property to the constructor name', () => {
      const err = new DelayedError();
      expect(err.name).toEqual('DelayedError');
    });

    it('is an instance of Error and DelayedError', () => {
      const err = new DelayedError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DelayedError);
    });

    it('preserves instanceof across try/catch (prototype chain restored)', () => {
      try {
        throw new DelayedError();
      } catch (err) {
        expect(err).toBeInstanceOf(DelayedError);
        expect(err).toBeInstanceOf(Error);
      }
    });
  });

  describe('RateLimitError', () => {
    it('exposes the expected error code constant', () => {
      expect(RATE_LIMIT_ERROR).toEqual('bullmq:rateLimitExceeded');
    });

    it('uses the default message when none is provided', () => {
      const err = new RateLimitError();
      expect(err.message).toEqual(RATE_LIMIT_ERROR);
    });

    it('uses a custom message when one is provided', () => {
      const err = new RateLimitError('too many requests');
      expect(err.message).toEqual('too many requests');
    });

    it('sets the name property to the constructor name', () => {
      const err = new RateLimitError();
      expect(err.name).toEqual('RateLimitError');
    });

    it('is an instance of Error and RateLimitError', () => {
      const err = new RateLimitError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(RateLimitError);
    });
  });

  describe('UnrecoverableError', () => {
    it('exposes the expected error code constant', () => {
      expect(UNRECOVERABLE_ERROR).toEqual('bullmq:unrecoverable');
    });

    it('uses the default message when none is provided', () => {
      const err = new UnrecoverableError();
      expect(err.message).toEqual(UNRECOVERABLE_ERROR);
    });

    it('uses a custom message when one is provided', () => {
      const err = new UnrecoverableError('cannot recover');
      expect(err.message).toEqual('cannot recover');
    });

    it('sets the name property to the constructor name', () => {
      const err = new UnrecoverableError();
      expect(err.name).toEqual('UnrecoverableError');
    });

    it('is an instance of Error and UnrecoverableError', () => {
      const err = new UnrecoverableError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(UnrecoverableError);
    });
  });

  describe('WaitingChildrenError', () => {
    it('exposes the expected error code constant', () => {
      expect(WAITING_CHILDREN_ERROR).toEqual('bullmq:movedToWaitingChildren');
    });

    it('uses the default message when none is provided', () => {
      const err = new WaitingChildrenError();
      expect(err.message).toEqual(WAITING_CHILDREN_ERROR);
    });

    it('uses a custom message when one is provided', () => {
      const err = new WaitingChildrenError('waiting on children');
      expect(err.message).toEqual('waiting on children');
    });

    it('sets the name property to the constructor name', () => {
      const err = new WaitingChildrenError();
      expect(err.name).toEqual('WaitingChildrenError');
    });

    it('is an instance of Error and WaitingChildrenError', () => {
      const err = new WaitingChildrenError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(WaitingChildrenError);
    });
  });

  describe('WaitingError', () => {
    it('exposes the expected error code constant', () => {
      expect(WAITING_ERROR).toEqual('bullmq:movedToWait');
    });

    it('uses the default message when none is provided', () => {
      const err = new WaitingError();
      expect(err.message).toEqual(WAITING_ERROR);
    });

    it('uses a custom message when one is provided', () => {
      const err = new WaitingError('moved to wait');
      expect(err.message).toEqual('moved to wait');
    });

    it('sets the name property to the constructor name', () => {
      const err = new WaitingError();
      expect(err.name).toEqual('WaitingError');
    });

    it('is an instance of Error and WaitingError', () => {
      const err = new WaitingError();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(WaitingError);
    });
  });

  describe('error classes are distinct', () => {
    it('does not cross-identify between unrelated error subclasses', () => {
      const delayed = new DelayedError();
      const waiting = new WaitingError();
      const waitingChildren = new WaitingChildrenError();
      const unrecoverable = new UnrecoverableError();
      const rateLimit = new RateLimitError();

      expect(delayed).not.toBeInstanceOf(WaitingError);
      expect(waiting).not.toBeInstanceOf(DelayedError);
      expect(waitingChildren).not.toBeInstanceOf(WaitingError);
      expect(unrecoverable).not.toBeInstanceOf(RateLimitError);
      expect(rateLimit).not.toBeInstanceOf(UnrecoverableError);
    });
  });
});
