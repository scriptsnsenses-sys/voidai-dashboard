export function generateMaskedKey(fullKey: string): string {
  if (!fullKey || fullKey.length < 8) {
    return '***';
  }

  const start = fullKey.slice(0, 4);
  const end = fullKey.slice(-4);
  const middleLength = Math.max(0, fullKey.length - 8);
  const middle = '*'.repeat(Math.min(middleLength, 20)); 

  return `${start}${middle}${end}`;
}

export function updateMaskedKeyIfMissing(apiKey: any): any {
  if (!apiKey.maskedKey && apiKey.encrypted) {

    return {
      ...apiKey,
      maskedKey: `vd-****${apiKey.id.slice(-4)}`
    };
  }
  return apiKey;
}