import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTurkeyInflation } from './evds';

describe('getTurkeyInflation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    global.fetch = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns fallback data when EVDS_API_KEY is missing', async () => {
    delete process.env.EVDS_API_KEY;
    const result = await getTurkeyInflation();
    expect(console.warn).toHaveBeenCalledWith("EVDS_API_KEY is missing. Returning fallback data.");
    expect(result).toBeNull();
  });

  it('fetches data successfully when API key is present', async () => {
    process.env.EVDS_API_KEY = 'test_key';
    const mockData = { items: [{ data: 'test' }] };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await getTurkeyInflation();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchUrl = (global.fetch as any).mock.calls[0][0];
    expect(fetchUrl).toContain('key=test_key');
    expect(fetchUrl).toContain('series=TP.FG.S01');
    expect(result).toEqual(mockData.items);
  });

  it('returns null on API error (non-ok response)', async () => {
    process.env.EVDS_API_KEY = 'test_key';
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const result = await getTurkeyInflation();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when fetch throws an error', async () => {
    process.env.EVDS_API_KEY = 'test_key';
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await getTurkeyInflation();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
