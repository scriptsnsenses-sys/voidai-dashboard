export async function getApiModels() {
  const response = await fetch('/api/models', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch model catalog');
  }

  return response.json();
}