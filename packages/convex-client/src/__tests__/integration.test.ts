import { describe, it, expect, beforeAll } from 'vitest';
import { Convex } from '../convex.js';
import { KeyPair } from '../KeyPair.js';
import { ConvexError } from '../ConvexError.js';

const PEER_URL = 'https://mikera1337-convex-testnet.hf.space';

describe('integration (test peer)', () => {
  const client = new Convex(PEER_URL);
  client.setTimeout(15000);

  // One faucet account for the whole test run
  let kp: KeyPair;

  beforeAll(async () => {
    kp = KeyPair.generate();
    const info = await client.createAccount(kp, 100_000_000);
    client.setAccount(info.address, kp);
  }, 30000);

  it('should query *balance* for own account', async () => {
    const result = await client.balance();
    expect(typeof result.value).toBe('number');
    expect(result.value).toBeGreaterThan(0);
  }, 15000);

  it('should query balance of another account', async () => {
    const result = await client.balance('#13');
    expect(typeof result.value).toBe('number');
    expect(result.value).toBeGreaterThanOrEqual(0);
  }, 15000);

  it('should resolve @convex.core to #8', async () => {
    const result = await client.query('@convex.core');
    expect(result.result).toBe('#8');
  }, 15000);

  it('should resolve CNS via handle', async () => {
    const handle = client.cns('convex.core');
    const result = await handle.resolve();
    expect(result.result).toBe('#8');
  }, 15000);

  it('should transfer coins to another address', async () => {
    const result = await client.transfer('#13', 100);
    expect(result.value).toBe(100);
  }, 15000);

  it('should throw ConvexError on bad query', async () => {
    try {
      await client.query('(assert false)');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ConvexError);
      expect((e as ConvexError).code).toBe('ASSERT');
    }
  }, 15000);

  it('should get account info', async () => {
    const info = await client.getAccountInfo();
    expect(info.address).toBe(client.getAddress());
    expect(typeof info.balance).toBe('number');
    expect(typeof info.sequence).toBe('number');
  }, 15000);
});
