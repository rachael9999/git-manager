const axios = require('axios');
const cache = require('../middleware/redis/cacheManager');
const rateLimiter = require('../middleware/rateLimiter');
const { fetchUserProfile, fetchUserRepos } = require('../service/fetchUser');
const { CACHE_TTL } = require('../middleware/redis/constants/cache_ttl');
const logger = require('../utils/logger/winstonConfig').logger;

jest.mock('axios');
jest.mock('../middleware/redis/cacheManager');
jest.mock('../middleware/rateLimiter');

const sampleUserProfile = { id: 1, login: 'testUser', name: 'Test User' };
const sampleUserRepos = [{ id: 1, name: 'repo1', owner: { login: 'user1', id: 1, avatar_url: 'url', html_url: 'url' } }, { id: 2, name: 'repo2', owner: { login: 'user2', id: 2, avatar_url: 'url', html_url: 'url' } }];
const sampleCacheProfile = { status: 200, data: sampleUserProfile };
const sampleCacheRepos = { status: 200, data: sampleUserRepos };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchUserProfile', () => {
  test('should return cached data for user profile', async () => {
    cache.getCacheValue.mockResolvedValue(sampleCacheProfile);

    const result = await fetchUserProfile('testUser');

    expect(result).toEqual(sampleUserProfile);
    expect(cache.getCacheValue).toHaveBeenCalledWith('user_testUser');
  });

  test('should fetch and cache user profile on cache miss', async () => {
    cache.getCacheValue.mockResolvedValue(null);
    rateLimiter.schedule.mockResolvedValue({ data: sampleUserProfile });
    cache.setCacheValue.mockResolvedValue(true);

    const result = await fetchUserProfile('testUser');

    expect(result).toEqual(sampleUserProfile);
    expect(cache.getCacheValue).toHaveBeenCalledWith('user_testUser');
    expect(rateLimiter.schedule).toHaveBeenCalledWith(expect.any(Function));
    expect(cache.setCacheValue).toHaveBeenCalledWith('user_testUser', { status: 200, data: sampleUserProfile }, CACHE_TTL.users);
  });
});

describe('fetchUserRepos', () => {
  test('should fetch and cache user repos on cache miss', async () => {
    cache.getCacheValue.mockResolvedValue(null);
    rateLimiter.schedule.mockResolvedValue({ data: sampleUserRepos });
    cache.setCacheValue.mockResolvedValue(true);
    cache.setUserRepoMaxPageCount.mockImplementation(() => ({ catch: jest.fn() }));

    const result = await fetchUserRepos('testUser', 1);

    expect(result).toEqual(sampleUserRepos);
    expect(cache.getCacheValue).toHaveBeenCalledWith('user_repos_testUser_1');
    expect(rateLimiter.schedule).toHaveBeenCalledWith(expect.any(Function));
    expect(cache.setCacheValue).toHaveBeenCalledWith('user_repos_testUser_1', { status: 200, data: sampleUserRepos }, CACHE_TTL.users);
  });

  test('should handle invalid page number by returning redirect data', async () => {
    cache.getCacheValue.mockResolvedValue(null);
    rateLimiter.schedule.mockResolvedValue({ data: sampleUserRepos });
    cache.setCacheValue.mockResolvedValue(true);
    cache.setUserRepoMaxPageCount.mockImplementation(() => ({ catch: jest.fn() }));

    const result = await fetchUserRepos('testUser', 10); // Assuming 10 is an invalid page number

    expect(result).toEqual({ status: 303, redirect: true, page: 1 });
    expect(cache.setCacheValue).toHaveBeenCalledWith('user_repos_testUser_10', { status: 303, redirect: true, page: 1 }, CACHE_TTL.negative);
  });

  test('should return cached redirect data for invalid page number', async () => {
    const redirectData = { status: 303, redirect: true, page: 1 };
    cache.getCacheValue.mockResolvedValue({ data: redirectData });

    const result = await fetchUserRepos('testUser', 10); // Assuming 10 is an invalid page number

    expect(result).toEqual(redirectData);
    expect(cache.getCacheValue).toHaveBeenCalledWith('user_repos_testUser_10');
  });

});
