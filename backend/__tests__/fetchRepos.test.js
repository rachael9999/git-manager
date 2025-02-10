const axios = require('axios');
const cache = require('../middleware/redis/cacheManager');
const rateLimiter = require('../middleware/rateLimiter');
const { fetchRepositories, fetchRepoDetail, fetchTrendingRepositories } = require('../service/fetchRepos');
const { CACHE_TTL } = require('../middleware/redis/constants/cache_ttl');
const logger = require('../utils/logger/winstonConfig');

jest.mock('../middleware/redis/cacheManager');
jest.mock('../middleware/rateLimiter');
jest.mock('../utils/logger/winstonConfig');

// Sample test data
const sampleRepoData = [
  {
    id: 1,
    name: 'test-repo',
    description: 'Test repository',
    html_url: 'https://github.com/test/test-repo',
    full_name: 'test/test-repo',
    owner: {
        login: 'test',
        id: 123,
        avatar_url: 'https://github.com/test.png',
        html_url: 'https://github.com/test'
    }
  }
];

const sampleRepoDetail = {
  id: 1,
  name: 'test-repo',
  description: 'Test repository',
  html_url: 'https://github.com/test/test-repo',
  full_name: 'test/test-repo',
  stargazers_count: 100,
  forks_count: 50,
  language: 'JavaScript',
  license: null,
  archived: false,
  disabled: false,
  visibility: 'public',
  subscribers_count: 10,
  owner: {
      login: 'test',
      id: 123,
      avatar_url: 'https://github.com/test.png',
      html_url: 'https://github.com/test'
  }
};

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  logger.error = jest.fn();
  logger.warn = jest.fn();
});

describe('fetchRepositories', () => {

  test('redirect to page 1 when previous page is not cached', async () => {
    cache.getCacheValue = jest.fn().mockResolvedValue(null);

    const result = await fetchRepositories(0, 2, 'sessionId');

    expect(result).toEqual({ redirect: true, page: 1 });
  });

  test('API error', async () => {
    cache.getCacheValue = jest.fn().mockResolvedValue(null);
    cache.setCacheValue = jest.fn().mockResolvedValue(true);
    const apiError = new Error('API Error');
    apiError.response = { status: 500 };
    rateLimiter.schedule = jest.fn().mockRejectedValue(apiError);

    await expect(fetchRepositories(0, 1, 'sessionId')).rejects.toThrow('API Error');
  });

  test('undefined requestedPage', async () => {
    cache.getCacheValue = jest.fn().mockResolvedValue(null);
    rateLimiter.schedule = jest.fn().mockResolvedValue({ data: sampleRepoData });
    cache.setCacheValue = jest.fn().mockResolvedValue(true);

    const result = await fetchRepositories(0, undefined, 'sessionId');
    expect(result).toEqual(sampleRepoData);
  });

  test('null requestedPage', async () => {
    cache.getCacheValue = jest.fn().mockResolvedValue(null);
    rateLimiter.schedule = jest.fn().mockResolvedValue({ data: sampleRepoData });
    cache.setCacheValue = jest.fn().mockResolvedValue(true);

    const result = await fetchRepositories(0, null, 'sessionId');
    expect(result).toEqual(sampleRepoData);
  });

});

describe('fetchRepoDetail', () => {

  test('set cache value', async () => {
    cache.getCacheValue = jest.fn().mockResolvedValue(null);
    
    rateLimiter.schedule = jest.fn().mockResolvedValue({ data: sampleRepoDetail });
  
    cache.setCacheValue = jest.fn().mockResolvedValue(true);

    await fetchRepoDetail(1);

    expect(cache.setCacheValue).toHaveBeenCalledWith(
        'detail_repo_1',
        {
            status: 200,
            data: sampleRepoDetail
        },
        CACHE_TTL.REPO_DETAIL
    );
  });

  test('API errors without response status', async () => {
    cache.getCacheValue = jest.fn().mockResolvedValue(null);
    rateLimiter.schedule = jest.fn().mockRejectedValue(new Error('Network Error'));

    await expect(fetchRepoDetail(1)).rejects.toThrow('Network Error');
  });

  test('return cached data', async () => {
    const cachedData = {
      status: 200,
      data: sampleRepoDetail
    };
    cache.getCacheValue = jest.fn().mockResolvedValue(cachedData);

    const result = await fetchRepoDetail(1);

    expect(result).toEqual(sampleRepoDetail);
    expect(cache.getCacheValue).toHaveBeenCalledWith('detail_repo_1');
  });

  test('fetch and cache repository detail on cache miss', async () => {
    cache.getCacheValue = jest.fn().mockResolvedValue(null);
    rateLimiter.schedule = jest.fn().mockResolvedValue({ data: sampleRepoDetail });
    cache.setCacheValue = jest.fn().mockResolvedValue(true);

    const result = await fetchRepoDetail(1);

    expect(result).toEqual(sampleRepoDetail);
    expect(cache.getCacheValue).toHaveBeenCalledWith('detail_repo_1');
    expect(rateLimiter.schedule).toHaveBeenCalledWith(expect.any(Function));
    expect(cache.setCacheValue).toHaveBeenCalledWith(
      'detail_repo_1',
      {
          status: 200,
          data: sampleRepoDetail
      },
      CACHE_TTL.REPO_DETAIL
    );
  });

  test('404 error and cache negative result', async () => {
    cache.getCacheValue = jest.fn().mockResolvedValue(null);
    const notFoundError = new Error('Not Found');
    notFoundError.response = { status: 404 };
    rateLimiter.schedule = jest.fn().mockRejectedValue(notFoundError);
    cache.setCacheValue = jest.fn().mockResolvedValue(true);

    await expect(fetchRepoDetail(999)).rejects.toThrow('Not Found');
    expect(cache.setCacheValue).toHaveBeenCalledWith(
      'detail_repo_999',
      {
          status: 404,
          error: 'Repository not found'
      },
      CACHE_TTL.negative || 600
    );
  });

});

describe('fetchTrendingRepositories', () => {
  const sampleTrendingData = {
    items: [
      {
        id: 1,
        name: 'trending-repo',
        full_name: 'test/trending-repo',
        description: 'Trending test repository',
        html_url: 'https://github.com/test/trending-repo',
        url: 'https://api.github.com/repos/test/trending-repo',
        stargazers_count: 1000,
        forks_count: 100,
        language: 'JavaScript',
        owner: {
            login: 'test',
            id: 123,
            avatar_url: 'https://github.com/test.png',
            html_url: 'https://github.com/test'
        }
      }
    ]
  };

  test('fetch and cache trending repositories', async () => {
    cache.getCacheValue = jest.fn().mockResolvedValue(null);
    rateLimiter.schedule = jest.fn().mockResolvedValue({ data: sampleTrendingData });
    cache.setCacheValue = jest.fn().mockResolvedValue(true);

    const result = await fetchTrendingRepositories('week', 'JavaScript', 1);

    expect(result.status).toBe(200);
    expect(result.data[0]).toEqual({
        id: 1,
        name: 'trending-repo',
        full_name: 'test/trending-repo',
        description: 'Trending test repository',
        html_url: 'https://github.com/test/trending-repo',
        url: 'https://api.github.com/repos/test/trending-repo',
        stars: 1000,
        forks: 100,
        language: 'JavaScript',
        owner: {
          login: 'test',
          id: 123,
          avatar_url: 'https://github.com/test.png',
          html_url: 'https://github.com/test'
        }
    });
  });

  test('return cached datae', async () => {
    const cachedData = {
        status: 200,
        data: [{
            id: 1,
            name: 'cached-repo',
            stars: 500
        }],
        total_pages: 1
    };
    cache.getCacheValue = jest.fn().mockResolvedValue(cachedData);

    const result = await fetchTrendingRepositories('day', null, 1);

    expect(result).toEqual(cachedData);
    expect(rateLimiter.schedule).not.toHaveBeenCalled();
  });

  test('redirect to page 1', async () => {
    cache.getCacheValue = jest.fn().mockResolvedValue(null);
    rateLimiter.schedule = jest.fn().mockResolvedValue({ data: { items: [sampleTrendingData.items[0]] } });
    cache.setCacheValue = jest.fn().mockResolvedValue(true);

    const result = await fetchTrendingRepositories('day', null, 5);

    expect(result).toEqual({
      status: 303,
      redirect: true,
      page: 1
    });
  });
});
