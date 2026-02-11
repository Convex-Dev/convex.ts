import { Convex } from '../convex.js';
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
          body: JSON.stringify({ address: '#12', source: '(* 2 3)' }),
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

    it('should throw on HTTP error', async () => {
      (fetch as any).mockResolvedValueOnce(
        mockResponse({ error: 'Bad request' }, false, 400)
      );

      await expect(client.query('bad')).rejects.toThrow('Convex API Error: Bad request');
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

      expect(info.address).toBe('42');
      expect(info.balance).toBe(1000000);
      expect(info.sequence).toBe(5);
      expect(info.publicKey).toBe('abcd1234');
    });

    it('should throw if no address set', async () => {
      await expect(client.getAccountInfo()).rejects.toThrow('No account set');
    });
  });

  describe('setTimeout', () => {
    it('should update the timeout', () => {
      // Just verify it doesn't throw
      client.setTimeout(5000);
    });
  });
});
