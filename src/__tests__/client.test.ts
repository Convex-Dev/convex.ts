import { ConvexClient } from '../client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const CONVEX_PEER_URL = process.env.CONVEX_PEER_URL || 'https://convex.world';

describe('ConvexClient', () => {
  let client: ConvexClient;

  beforeEach(() => {
    client = new ConvexClient(CONVEX_PEER_URL);
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('should create an account with initial balance', async () => {
      const mockResponse = {
        data: {
          keyPair: {
            publicKey: 'pub123',
            privateKey: 'priv123'
          },
          account: {
            address: 'addr123',
            balance: 1000000,
            sequence: 0
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.createAccount(1000000);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/account/create', {
        initialBalance: 1000000
      });
      expect(result).toEqual(mockResponse.data.account);
    });
  });

  describe('query', () => {
    it('should execute a query', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: { value: 123 }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.query({
        type: 'test',
        params: { key: 'value' }
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/query', {
        type: 'test',
        params: { key: 'value' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
}); 