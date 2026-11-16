import { prisma } from '@/shared/infra/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      { status: 'ok' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error(JSON.stringify({
      event: 'database_readiness_failed',
      timestamp: new Date().toISOString(),
      errorName: error instanceof Error ? error.name : 'UnknownError',
    }));

    return Response.json(
      { status: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
