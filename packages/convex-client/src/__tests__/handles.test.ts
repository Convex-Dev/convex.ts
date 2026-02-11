import { Convex } from '../convex.js';
import { AssetHandle } from '../AssetHandle.js';
import { FungibleToken } from '../FungibleToken.js';
import { CnsHandle } from '../CnsHandle.js';
import { KeyPair } from '../KeyPair.js';
import { vi } from 'vitest';

const PEER_URL = 'http://localhost:8080';

function mockResponse(data: any, ok = true, status = 200): Response {
  return { ok, status, json: () => Promise.resolve(data) } as Response;
}

/** Extract the CVM source string from the most recent fetch call body */
function lastSource(): string {
  const call = (fetch as any).mock.calls.at(-1);
  return JSON.parse(call[1].body).source;
}

describe('FungibleToken', () => {
  let client: Convex;
  let token: FungibleToken;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    client = new Convex(PEER_URL);
    token = client.fungible('#128');
  });

  afterEach(() => vi.restoreAllMocks());

  it('should query balance with *address*', async () => {
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 1000 }));
    await token.balance();
    expect(lastSource()).toBe('(@convex.fungible/balance #128 *address*)');
  });

  it('should query balance for specific holder', async () => {
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 500 }));
    await token.balance('#13');
    expect(lastSource()).toBe('(@convex.fungible/balance #128 #13)');
  });

  it('should query balance with CNS holder', async () => {
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 0 }));
    await token.balance('@user.mike');
    expect(lastSource()).toBe('(@convex.fungible/balance #128 @user.mike)');
  });

  it('should generate transfer source', async () => {
    const kp = KeyPair.generate();
    client.setAccount('#42', kp);
    (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 100 }));

    await token.transfer('#13', 100);

    // Check prepare call source
    const prepareBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(prepareBody.source).toBe('(@convex.fungible/transfer #128 #13 100)');
  });

  it('should accept bigint amounts', async () => {
    const kp = KeyPair.generate();
    client.setAccount('#42', kp);
    (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: true }));

    await token.transfer('#13', 1000000000000000000n);

    const prepareBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(prepareBody.source).toBe('(@convex.fungible/transfer #128 #13 1000000000000000000)');
  });

  it('should generate mint source', async () => {
    const kp = KeyPair.generate();
    client.setAccount('#42', kp);
    (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 1000 }));

    await token.mint(1000);

    const prepareBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(prepareBody.source).toBe('(@convex.fungible/mint #128 1000)');
  });

  it('should generate burn source', async () => {
    const kp = KeyPair.generate();
    client.setAccount('#42', kp);
    (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 500 }));

    await token.burn(500);

    const prepareBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(prepareBody.source).toBe('(@convex.fungible/burn #128 500)');
  });

  it('should query supply', async () => {
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 1000000 }));
    await token.supply();
    expect(lastSource()).toBe('(@convex.fungible/total-supply #128)');
  });

  it('should query decimals', async () => {
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 6 }));
    await token.decimals();
    expect(lastSource()).toBe('(@convex.fungible/decimals #128)');
  });

  it('should be instanceof AssetHandle', () => {
    expect(token).toBeInstanceOf(AssetHandle);
  });
});

describe('AssetHandle', () => {
  let client: Convex;
  let asset: AssetHandle;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    client = new Convex(PEER_URL);
    asset = client.asset('#256');
  });

  afterEach(() => vi.restoreAllMocks());

  it('should query balance', async () => {
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 42 }));
    await asset.balance();
    expect(lastSource()).toBe('(@convex.asset/balance #256 *address*)');
  });

  it('should query balance for holder', async () => {
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 10 }));
    await asset.balance('#13');
    expect(lastSource()).toBe('(@convex.asset/balance #256 #13)');
  });

  it('should generate transfer with numeric quantity', async () => {
    const kp = KeyPair.generate();
    client.setAccount('#42', kp);
    (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: true }));

    await asset.transfer('#13', 100);

    const prepareBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(prepareBody.source).toBe('(@convex.asset/transfer #13 #256 100)');
  });

  it('should sandbox string quantities with (query ...) in transfer', async () => {
    const kp = KeyPair.generate();
    client.setAccount('#42', kp);
    (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: true }));

    await asset.transfer('#13', '#{:foo :bar}');

    const prepareBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(prepareBody.source).toBe('(@convex.asset/transfer #13 #256 (query #{:foo :bar}))');
  });

  it('should sandbox string quantities in offer', async () => {
    const kp = KeyPair.generate();
    client.setAccount('#42', kp);
    (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: true }));

    await asset.offer('#13', '#{1 2 3}');

    const prepareBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(prepareBody.source).toBe('(@convex.asset/offer #13 #256 (query #{1 2 3}))');
  });

  it('should generate accept source', async () => {
    const kp = KeyPair.generate();
    client.setAccount('#42', kp);
    (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: true }));

    await asset.accept('#13', 50);

    const prepareBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(prepareBody.source).toBe('(@convex.asset/accept #13 #256 50)');
  });

  it('should query supply', async () => {
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 1000000 }));
    await asset.supply();
    expect(lastSource()).toBe('(@convex.asset/total-supply #256)');
  });
});

describe('CnsHandle', () => {
  let client: Convex;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    client = new Convex(PEER_URL);
  });

  afterEach(() => vi.restoreAllMocks());

  it('should validate name on construction', () => {
    expect(() => client.cns('')).toThrow('Invalid CNS name');
    expect(() => client.cns('123')).toThrow('Invalid CNS name');
    expect(() => client.cns('foo) (hack')).toThrow('Invalid CNS name');
  });

  it('should accept valid names', () => {
    expect(client.cns('convex.core').getName()).toBe('convex.core');
    expect(client.cns('user.mike').getName()).toBe('user.mike');
    expect(client.cns('my-token').getName()).toBe('my-token');
  });

  it('should generate resolve query', async () => {
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: 8, result: '#8' }));

    const handle = client.cns('convex.core');
    const result = await handle.resolve();

    expect(lastSource()).toBe("(@convex.cns/resolve 'convex.core)");
    expect(result.result).toBe('#8');
  });

  it('should generate set transaction', async () => {
    const kp = KeyPair.generate();
    client.setAccount('#42', kp);
    (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: true }));

    await client.cns('user.mike').set('#1678');

    const prepareBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(prepareBody.source).toBe("(@convex.cns/update 'user.mike #1678)");
  });

  it('should generate setController transaction', async () => {
    const kp = KeyPair.generate();
    client.setAccount('#42', kp);
    (fetch as any).mockResolvedValueOnce(mockResponse({ hash: 'abc123' }));
    (fetch as any).mockResolvedValueOnce(mockResponse({ value: true }));

    await client.cns('user.mike').setController('#99');

    const prepareBody = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(prepareBody.source).toBe("(@convex.cns/control 'user.mike #99)");
  });
});
