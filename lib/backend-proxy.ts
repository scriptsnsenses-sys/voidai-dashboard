const BACKEND_URL = 'https://voidai-backend.onrender.com';

const REQUEST_HEADERS = [
  'accept',
  'authorization',
  'content-type',
  'openai-organization',
  'openai-project',
  'x-api-key',
];

const RESPONSE_HEADERS = [
  'content-type',
  'cache-control',
  'retry-after',
  'x-request-id',
  'x-ratelimit-limit-requests',
  'x-ratelimit-remaining-requests',
  'x-ratelimit-reset-requests',
  'x-ratelimit-limit-tokens',
  'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-tokens',
];

export async function proxyBackendRequest(request: Request, path: string) {
  try {
    const headers = new Headers();
    for (const name of REQUEST_HEADERS) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    const method = request.method.toUpperCase();
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    for (const name of RESPONSE_HEADERS) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set('Cache-Control', 'no-store');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        error: {
          message: 'The VoidAI backend could not be reached.',
          type: 'api_error',
          code: 'backend_unavailable',
        },
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}