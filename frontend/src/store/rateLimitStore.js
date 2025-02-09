let isRateLimited = false;
let lastAttemptedRoute = null;

export const setRateLimitState = (state) => {
  isRateLimited = state;
  if (!state) {
    lastAttemptedRoute = null;
  }
};

export const getRateLimitState = () => {
  return isRateLimited;
};

export const setLastAttemptedRoute = (route) => {
  if (route && route.name && route.name !== 'Loading' && route.name !== 'Home') {
    lastAttemptedRoute = {
      name: route.name,
      params: route.params || {},
      query: route.query || {}
    };
  }
};

export const getLastAttemptedRoute = () => {
  return lastAttemptedRoute;
};