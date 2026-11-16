import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context
) => {
  const rawRequestId =
    request.headers['x-vercel-id'] ?? request.headers['x-request-id'];
  const requestId = Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId;

  console.error(JSON.stringify({
    event: 'next_request_error',
    timestamp: new Date().toISOString(),
    route: context.routePath,
    routeType: context.routeType,
    method: request.method,
    path: request.path.split('?')[0],
    requestId: requestId?.slice(0, 128),
    errorName: error instanceof Error ? error.name : 'UnknownError',
  }));
};
