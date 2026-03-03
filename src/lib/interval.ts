/** 인터벌 문자열을 초 단위로 변환. */
export function intervalToSeconds(interval: string): number {
  const map: Record<string, number> = {
    "1m": 60,
    "3m": 180,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "1d": 86400,
    "1w": 604800,
    "1M": 2592000,
  }
  return map[interval] ?? 86400
}
