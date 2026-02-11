import { describe, it, expect } from 'vitest';
import { Convex } from '../convex.js';

const PEER_URL = 'https://peer.convex.live';

describe('integration (live peer)', () => {
  it('should query balance of account #13', async () => {
    const client = new Convex(PEER_URL);
    const result = await client.query('(balance #13)');

    expect(result.errorCode).toBeUndefined();
    expect(typeof result.value).toBe('number');
    expect(result.value).toBeGreaterThanOrEqual(0);
  });

  it('should resolve CNS address @convex.core to #8', async () => {
    const client = new Convex(PEER_URL);
    const result = await client.query('@convex.core');

    expect(result.errorCode).toBeUndefined();
    expect(result.result).toBe('#8');
  });
});
