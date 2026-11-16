import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { $queryRaw: vi.fn() },
}));

vi.mock('@/shared/infra/prisma', () => ({ prisma: prismaMock }));

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports readiness when PostgreSQL is reachable', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('reports unavailable and logs a database failure', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('database unavailable'));
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: 'unavailable' });
    expect(logError).toHaveBeenCalledOnce();
    expect(logError.mock.calls[0][0]).toContain('database_readiness_failed');
    expect(logError.mock.calls[0][0]).not.toContain('database unavailable');

  });
});
