jest.mock('axios');
jest.mock('../middleware/redis/cacheManager');
jest.mock('../utils/rateLimiter');

const sampleUserProfile = { id: 1, login: 'testUser', name: 'Test User' };
const sampleUserRepos = [
    { id: 1, name: 'repo1', owner: { login: 'user1', id: 1, avatar_url: 'url', html_url: 'url' } },
    { id: 2, name: 'repo2', owner: { login: 'user2', id: 2, avatar_url: 'url', html_url: 'url' } }
];

test('fetch user profile', async () => {
    // Your test implementation here
});