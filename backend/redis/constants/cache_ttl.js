const CACHE_TTL = {
  repositories: 3600,    // 1 hour
  users: 7200,          // 2 hours
  issues: 1800,         // 30 minutes
  negative: 600,        // 10 minutes
  sessions: 86400        // 1 day
};

module.exports = {
  CACHE_TTL
};