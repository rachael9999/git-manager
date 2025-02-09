let isRateLimited = false;

export const setRateLimitState = (state) => {
  isRateLimited = state;
};

export const getRateLimitState = () => {
  return isRateLimited;
};