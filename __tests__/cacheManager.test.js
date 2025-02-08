const redisClient = require('../redis/redisClient');
test('redisClient module should be present', () => {
	expect(redisClient).toBeDefined();
});