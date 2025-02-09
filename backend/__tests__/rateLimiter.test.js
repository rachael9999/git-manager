const rateLimiter = require('../middleware/rateLimiter');

describe('Rate Limiter', () => {
  test('should implement exponential backoff on rate limit', async () => {
    const mockRequest = jest.fn()
      .mockRejectedValueOnce({ response: { status: 429 } })  // First call: rate limit
      .mockRejectedValueOnce({ response: { status: 429 } })  // Second call: rate limit
      .mockResolvedValueOnce({ data: 'success' });           // Third call: success

    try {
      const result = await rateLimiter.schedule(async () => {
        return await mockRequest();
      });
      
      expect(result).toEqual({ data: 'success' });
      expect(mockRequest).toHaveBeenCalledTimes(3);
    } catch (error) {
      fail('Should not have thrown an error');
    }
  }, 10000); // Increased timeout to account for retries

  test('should give up after max retries', async () => {
    const mockRequest = jest.fn()
      .mockRejectedValue({ response: { status: 429 } }); // Always rate limited

    await expect(rateLimiter.schedule(async () => {
      return await mockRequest();
    })).rejects.toEqual({ response: { status: 429 } });

    expect(mockRequest).toHaveBeenCalledTimes(4); // Initial + 3 retries
  }, 15000);
});