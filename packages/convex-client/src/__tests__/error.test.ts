import { ConvexError } from '../ConvexError.js';
import { throwIfError, formatBalance } from '../format.js';
import type { Result } from '../types.js';

describe('ConvexError', () => {
  it('should wrap a Result with error code', () => {
    const result: Result = { errorCode: 'FUNDS', value: 'Insufficient balance', info: { juice: 100 } };
    const error = new ConvexError(result);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConvexError);
    expect(error.name).toBe('ConvexError');
    expect(error.message).toBe('Convex error: FUNDS');
    expect(error.code).toBe('FUNDS');
    expect(error.info?.juice).toBe(100);
    expect(error.result).toBe(result);
  });

  it('should expose full result on error', () => {
    const result: Result = {
      errorCode: 'STATE',
      value: 'Bad state',
      result: '"Bad state"',
      info: { juice: 50, fees: 10, trace: ['line1'] },
    };
    const error = new ConvexError(result);

    expect(error.result.errorCode).toBe('STATE');
    expect(error.result.result).toBe('"Bad state"');
    expect(error.result.info?.trace).toEqual(['line1']);
  });
});

describe('throwIfError', () => {
  it('should return result on success', () => {
    const result: Result = { value: 42, result: '42' };
    expect(throwIfError(result)).toBe(result);
  });

  it('should throw ConvexError on error', () => {
    const result: Result = { errorCode: 'NOBODY' };
    expect(() => throwIfError(result)).toThrow(ConvexError);
  });

  it('should preserve result in thrown error', () => {
    const result: Result = { errorCode: 'FUNDS', info: { juice: 200 } };
    try {
      throwIfError(result);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect((e as ConvexError).result).toBe(result);
    }
  });
});

describe('formatBalance', () => {
  it('should format numbers', () => {
    expect(formatBalance(0)).toBe('0');
    expect(formatBalance(100)).toBe('100');
    expect(formatBalance(1000000)).toBe('1000000');
  });

  it('should format bigints', () => {
    expect(formatBalance(0n)).toBe('0');
    expect(formatBalance(1000000000000000000n)).toBe('1000000000000000000');
  });

  it('should format numeric strings', () => {
    expect(formatBalance('0')).toBe('0');
    expect(formatBalance('1000000000000000000')).toBe('1000000000000000000');
  });

  it('should reject negative numbers', () => {
    expect(() => formatBalance(-1)).toThrow('Invalid amount');
    expect(() => formatBalance(-100)).toThrow('Invalid amount');
  });

  it('should reject negative bigints', () => {
    expect(() => formatBalance(-1n)).toThrow('Negative amount');
  });

  it('should reject non-integer numbers', () => {
    expect(() => formatBalance(1.5)).toThrow('Invalid amount');
    expect(() => formatBalance(NaN)).toThrow('Invalid amount');
    expect(() => formatBalance(Infinity)).toThrow('Invalid amount');
  });

  it('should reject non-numeric strings', () => {
    expect(() => formatBalance('abc')).toThrow('Invalid amount');
    expect(() => formatBalance('-100')).toThrow('Invalid amount');
    expect(() => formatBalance('1.5')).toThrow('Invalid amount');
    expect(() => formatBalance('')).toThrow('Invalid amount');
    expect(() => formatBalance('#{:foo}')).toThrow('Invalid amount');
  });
});
