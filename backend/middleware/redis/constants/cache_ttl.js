const CACHE_TTL = {
  repositories: 3600,    // 1 hour
  users: 3600,           // 1 hour
  issues: 1800,          // 30 minutes
  negative: 300,         // 5 minutes
  sessions: 86400,       // 1 day
  REPO_DETAIL: 3600,     // 1 hour
  error: 60              // 1 minute for error responses like rate limits
};

module.exports = {
  CACHE_TTL
};