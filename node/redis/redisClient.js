const redis = require('redis');
const {logger} = require('../utils/logger/winstonConfig');

const redisClient = redis.createClient();

redisClient.on('error', (err) => {
  logger.info('Redis error:', err);
});

redisClient.connect().then(() => {
  logger.info('Connected to Redis');
});

module.exports = redisClient;