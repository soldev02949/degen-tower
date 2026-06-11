// BigInt utilities for handling extremely large numbers beyond Number.MAX_SAFE_INTEGER

export function safeBigInt(n: number | string | bigint): bigint {
  try {
    if (typeof n === 'bigint') return n;
    if (typeof n === 'string') return BigInt(n);
    if (n > Number.MAX_SAFE_INTEGER) return BigInt(Math.round(n));
    return BigInt(Math.floor(n));
  } catch {
    return BigInt(0);
  }
}

export function bigIntToNumber(b: bigint): number {
  const str = b.toString();
  return parseFloat(str);
}

export function addBigInt(a: number | bigint, b: number | bigint): bigint {
  return safeBigInt(a) + safeBigInt(b);
}

export function maxBigInt(a: number | bigint, b: number | bigint): bigint {
  const aBig = safeBigInt(a);
  const bBig = safeBigInt(b);
  return aBig > bBig ? aBig : bBig;
}

export function formatBigInt(n: number | bigint): string {
  const num = typeof n === 'bigint' ? bigIntToNumber(n) : n;
  if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Math.floor(num).toString();
}
