import { proxyBackendRequest } from '@/lib/backend-proxy';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return proxyBackendRequest(request, '/v1/models');
}