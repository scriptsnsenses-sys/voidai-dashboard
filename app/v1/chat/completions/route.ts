import { proxyBackendRequest } from '@/lib/backend-proxy';

export const dynamic = 'force-dynamic';

export function POST(request: Request) {
  return proxyBackendRequest(request, '/v1/chat/completions');
}