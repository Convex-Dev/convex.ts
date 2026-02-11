import { Convex } from '../convex.js';
import { KeyPair } from '../KeyPair.js';
import { ConvexError } from '../ConvexError.js';
import { vi } from 'vitest';

const CONVEX_PEER_URL = process.env.CONVEX_PEER_URL || 'http://peer.convex.live:8080';

/**
 * Helper to create a mock Response object for fetch.
 */
function mockResponse(data: any, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response;
}

describe('Convex', () => {
  let client: Convex;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    client = new Convex(CONVEX_PEER_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor and getters', () => {
    it('should return the peer URL', () => {
      expect(client.getPeerUrl()).toBe(CONVEX_PEER_URL);
    });

    it('should return undefined address when not set', () => {
      expect(client.getAddress()).toBeUndefined();
    });

    it('should return undefined signer when not set', () => {
      expect(client.getSigner()).toBeUndefined();
    });

    it('should report hasAccount as false when nothing set', () => {
      expect(client.hasAccount()).toBe(false);
    });

    it('should report hasAccount as false with only address', () => {
      client.setAddress('#42');
      expect(client.hasAccount()).toBe(false);
    });

    it('should report hasAccount as true with address and signer', () => {
      const kp = KeyPair.generate();
      client.setAccount('#42', kp);
      expect(client.hasAccount()).toBe(true);
    });

    it('should accept address as string with hash', () => {
      client.setAddress('#42');
      expect(client.getAddress()).toBe(42);
    });

    it('should accept address as plain numeric string', () => {
      client.setAddress('1678');
      expect(client.getAddress()).toBe(1678);
    });

    it('should accept address as number', () => {
      client.setAddress(42);
      expect(client.getAddress()).toBe(42);
    });

    it('should reject non-numeric address in setAddress', () => {
      expect(() => client.setAddress('garbage')).toThrow('Numeric address required');
      expect(() => client.setAddress('')).toThrow('Numeric address required');
      expect(() => client.setAddress('@convex.core')).toThrow('Numeric address required');
    });
  });

  describe('query', () => {
    it('should execute a query with object params', async () => {
      const queryResult = { value: 'mocked query result' };
      (fetch as any).mockResolvedValueOnce(mockResponse(queryResult));

      const result = await client.query({
        address: '#12',
        source: '(* 2 3)'
      });

      expect(fetch).toHaveBeenCalledWith(
        `${CONVEX_PEER_URL}/api/v1/query`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ source: '(* 2 3)', address: 12 }),
        })
      );

      expect(result).toEqual(queryResult);
    });

    it('should execute a query with string shorthand', async () => {
      const queryResult = { value: 42 };
      (fetch as any).mockResolvedValueOnce(mockResponse(queryResult));

      const result = await client.query('*timestamp*');

      expect(fetch).toHaveBeenCalledWith(
        `${CONVEX_PEER_URL}/api/v1/query`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ source: '*timestamp*' }),
        })
      );

      expect(result).toEqual(queryResult);
    });

    it('should accept numeric address in query', async () => {
      const queryResult = { value: 100 };
      (fetch as any).mockResolvedValueOnce(mockResponse(queryResult));

      await client.query({ source: '(balance)', address: 42 });

      const body = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(body.address).toBe(42);
    });

    it('should throw on HTTP error', async () => {
      (fetch as any).mockResolvedValueOnce(
        mockResponse({ error: 'Bad request' }, false, 400)
      );

      await expect(client.query('bad')).rejects.toThrow('Convex API Error: Bad request');
    });
  });

  describe('transact', () => {
    it('should throw if no account set', async () => {
      await expect(client.transact('(+ 1 2)')).rejects.toThrow('No account set');
    });

    it('should execute prepare/submit flow', async () => {
      const kp = KeyPair.generate();
      client.setAccount('#42', kp);

      // Mock prepare response
      (fetch as any).mockResolvedValueOnce(
        mockResponse({ hash: 'abc123' })
      );
      // Mock submit response
      (fetch as any).mockResolvedValueOnce(
        mockResponse({ value: 42, result: '42' })
      );

      const result = await client.transact('(+ 1 2)');

      // Verify prepare call
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        `${CONVEX_PEER_URL}/api/v1/transaction/prepare`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ address: 42, source: '(+ 1 2)' }),
        })
      );

      // Verify submit call includes hash, sig, and accountKey
      const submitCall = (fetch as any).mock.calls[1];
      expect(submitCall[0]).toBe(`${CONVEX_PEER_URL}/api/v1/transaction/submit`);
      const submitBody = JSON.parse(submitCall[1].body);
      expect(submitBody.hash).toBe('abc123');
      expect(submitBody.sig).toMatch(/^[0-9a-f]{128}$/); // 64-byte Ed25519 signature
      expect(submitBody.accountKey).toBe(kp.publicKeyHex);

      expect(result).toEqual({ value: 42, result: '42' });
    });
  });

  describe('getAccountInfo', () => {
    it('should fetch account info', async () => {
      client.setAddress('#42');

      const accountData = {
        address: '42',
        balance: 1000000,
        sequence: 5,
        key: 'abcd1234',
      };
      (fetch as any).mockResolvedValueOnce(mockResponse(accountData));

      const info = await client.getAccountInfo();

      expect(fetch).toHaveBeenCalledWith(
        `${CONVEX_PEER_URL}/api/v1/accounts/42`,
        expect.objectContaining({ method: 'GET' })
      );

      expect(info.address).toBe(42);
      expect(info.balance).toBe(1000000);
      expect(info.sequence).toBe(5);
      expect(info.publicKey).toBe('abcd1234');
    });

    it('should throw if no address set', async () => {
      await expect(client.getAccountInfo()).rejects.toThrow('No account set');
    });
  });

  describe('createAccount', () => {
    it('should create account with hex string key', async () => {
      const pubKeyHex = 'a'.repeat(64);
      (fetch as any).mockResolvedValueOnce(
        mockResponse({ address: 99, balance: 100000000 })
      );

      const info = await client.createAccount(pubKeyHex, 100000000);

      const body = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(body.accountKey).toBe(pubKeyHex);
      expect(body.faucet).toBe(100000000);
      expect(info.address).toBe(99);
      expect(info.balance).toBe(100000000);
    });

    it('should create account with KeyPair (sends only public key)', async () => {
      const kp = KeyPair.generate();
      (fetch as any).mockResolvedValueOnce(
        mockResponse({ address: 42, balance: 0 })
      );

      const info = await client.createAccount(kp);

      const body = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(body.accountKey).toBe(kp.publicKeyHex);
      expect(body.faucet).toBeUndefined();
      expect(info.address).toBe(42);
    });
  });

  describe('CVM error handling', () => {
    it('should throw ConvexError on query with CVM error', async () => {
      const errorResult = { errorCode: 'NOBODY', value: 'Account does not exist', info: { juice: 0 } };
      (fetch as any).mockResolvedValueOnce(mockResponse(errorResult));

      try {
        await client.query('(balance #999999)');
        expect.unreachable('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ConvexError);
        const ce = e as ConvexError;
        expect(ce.code).toBe('NOBODY');
        expect(ce.result.errorCode).toBe('NOBODY');
        expect(ce.result.info?.juice).toBe(0);
      }
    });

    it('should throw ConvexError on transact with CVM error', async () => {
      const kp = KeyPair.generate();
      client.setAccount('#42', kp);

      // Mock prepare response
      (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
      // Mock submit response with error
      const errorResult = { errorCode: 'FUNDS', value: 'Insufficient balance', info: { juice: 100, fees: 50 } };
      (fetch as any).mockResolvedValueOnce(mockResponse(errorResult));

      try {
        await client.transact('(transfer #13 999999999)');
        expect.unreachable('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ConvexError);
        const ce = e as ConvexError;
        expect(ce.code).toBe('FUNDS');
        expect(ce.info?.juice).toBe(100);
        expect(ce.info?.fees).toBe(50);
      }
    });

    it('should pass through successful results', async () => {
      const successResult = { value: 42, result: '42' };
      (fetch as any).mockResolvedValueOnce(mockResponse(successResult));

      const result = await client.query('(+ 1 2)');
      expect(result.value).toBe(42);
      expect(result.errorCode).toBeUndefined();
    });
  });

  describe('balance', () => {
    it('should query own balance with *balance*', async () => {
      (fetch as any).mockResolvedValueOnce(mockResponse({ value: 1000000 }));

      const result = await client.balance();

      const body = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(body.source).toBe('*balance*');
      expect(result.value).toBe(1000000);
    });

    it('should query another address balance', async () => {
      (fetch as any).mockResolvedValueOnce(mockResponse({ value: 500 }));

      const result = await client.balance('#13');

      const body = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(body.source).toBe('(balance #13)');
      expect(result.value).toBe(500);
    });
  });

  describe('factory methods', () => {
    it('should create asset handle', () => {
      const handle = client.asset('#128');
      expect(handle.getToken()).toBe('#128');
    });

    it('should create fungible token handle', () => {
      const handle = client.fungible('#128');
      expect(handle.getToken()).toBe('#128');
    });

    it('should create CNS handle', () => {
      const handle = client.cns('convex.core');
      expect(handle.getName()).toBe('convex.core');
    });

    it('should reject invalid CNS names', () => {
      expect(() => client.cns('')).toThrow('Invalid CNS name');
      expect(() => client.cns('123bad')).toThrow('Invalid CNS name');
      expect(() => client.cns('foo) (hack')).toThrow('Invalid CNS name');
    });
  });

  describe('setTimeout', () => {
    it('should update the timeout', () => {
      // Just verify it doesn't throw
      client.setTimeout(5000);
    });
  });
});
