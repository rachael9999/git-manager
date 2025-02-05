const redis = require('redis');
const {logger} = require('../logger/winstonConfig');

const redisClient = redis.createClient();

redisClient.on('error', (err) => {
  logger.info('Redis error:', err);
});

redisClient.connect().then(() => {
  logger.info('Connected to Redis');
});

module.exports = redisClient;