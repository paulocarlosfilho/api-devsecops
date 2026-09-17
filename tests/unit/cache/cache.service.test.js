const CacheService = require('../../../src/cache/cache.service');
const { getRedis } = require('../../../src/config/redis');

jest.mock('../../../src/config/redis');

describe('CacheService', () => {
  let mockRedis;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      scan: jest.fn(),
    };
    getRedis.mockReturnValue(mockRedis);
  });

  describe('get', () => {
    it('should return parsed data from cache', async () => {
      const data = { id: 1, name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await CacheService.get('test:1');

      expect(result).toEqual(data);
      expect(mockRedis.get).toHaveBeenCalledWith('test:1');
    });

    it('should return null on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await CacheService.get('test:missing');

      expect(result).toBeNull();
    });

    it('should return null when Redis is unavailable', async () => {
      getRedis.mockReturnValue(null);

      const result = await CacheService.get('test:1');

      expect(result).toBeNull();
    });

    it('should return null on Redis error (graceful degradation)', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection refused'));

      const result = await CacheService.get('test:1');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set data with TTL', async () => {
      const data = { id: 1, name: 'Test' };

      await CacheService.set('test:1', data, 300);

      expect(mockRedis.setex).toHaveBeenCalledWith('test:1', 300, JSON.stringify(data));
    });

    it('should set data without TTL', async () => {
      const data = { id: 1, name: 'Test' };

      await CacheService.set('test:1', data);

      expect(mockRedis.set).toHaveBeenCalledWith('test:1', JSON.stringify(data));
    });

    it('should not fail when Redis is unavailable', async () => {
      getRedis.mockReturnValue(null);

      await expect(CacheService.set('test:1', { data: true }, 300))
        .resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      await CacheService.del('test:1');

      expect(mockRedis.del).toHaveBeenCalledWith('test:1');
    });

    it('should not fail when Redis is unavailable', async () => {
      getRedis.mockReturnValue(null);

      await expect(CacheService.del('test:1'))
        .resolves.toBeUndefined();
    });
  });

  describe('invalidatePattern', () => {
    it('should scan and delete matching keys', async () => {
      mockRedis.scan
        .mockResolvedValueOnce(['0', ['products:1', 'products:2']]);

      await CacheService.invalidatePattern('products:*');

      expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', 'products:*', 'COUNT', 100);
      expect(mockRedis.del).toHaveBeenCalledWith('products:1', 'products:2');
    });

    it('should handle multiple scan iterations', async () => {
      mockRedis.scan
        .mockResolvedValueOnce(['42', ['products:1']])
        .mockResolvedValueOnce(['0', ['products:2']]);

      await CacheService.invalidatePattern('products:*');

      expect(mockRedis.scan).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
    });

    it('should handle no matching keys', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', []]);

      await CacheService.invalidatePattern('nonexistent:*');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('getTTL', () => {
    it('should return correct TTL for known types', async () => {
      expect(CacheService.getTTL('product')).toBe(300);
      expect(CacheService.getTTL('category')).toBe(600);
      expect(CacheService.getTTL('order')).toBe(60);
    });

    it('should return default TTL for unknown types', async () => {
      expect(CacheService.getTTL('unknown')).toBe(300);
    });
  });
});
