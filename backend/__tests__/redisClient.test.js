const redis = require('redis');
const { logger } = require('../utils/logger/winstonConfig');

jest.mock('redis');
jest.mock('../utils/logger/winstonConfig');

describe('Redis Client', () => {
  const mockRedisClient = {
    connect: jest.fn().mockResolvedValue(),
    configSet: jest.fn().mockResolvedValue(),
    expire: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue(),
    set: jest.fn().mockResolvedValue(),
    setEx: jest.fn().mockResolvedValue(),
    on: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redis.createClient.mockReturnValue(mockRedisClient);
  });

  test('should initialize Redis with LRU policy', async () => {
    const redisClient = require('../redis/redisClient');
    await redisClient.initRedis();

    expect(redis.createClient).toHaveBeenCalled();
    expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockRedisClient.connect).toHaveBeenCalled();
    expect(mockRedisClient.configSet).toHaveBeenCalledWith('maxmemory-policy', 'allkeys-lru');
    expect(mockRedisClient.configSet).toHaveBeenCalledWith('maxmemory', '20gb');
    expect(logger.info).toHaveBeenCalledWith('Redis initialized with LRU policy');
  });

  test('should update TTL for a key', async () => {
    const redisClient = require('../redis/redisClient');
    await redisClient.initRedis();
    await redisClient.updateTime('testKey', 3600);

    expect(mockRedisClient.expire).toHaveBeenCalledWith('testKey', 3600);
    expect(logger.info).toHaveBeenCalledWith('Updated TTL for testKey');
  });

  test('should get value for a key', async () => {
    const redisClient = require('../redis/redisClient');
    await redisClient.initRedis();
    mockRedisClient.get.mockResolvedValue('testValue');

    const value = await redisClient.get('testKey');
    expect(value).toBe('testValue');
    expect(logger.debug).toHaveBeenCalledWith('Retrieved value for testKey');
  });
});
