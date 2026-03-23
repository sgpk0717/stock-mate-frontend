export function formatKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value)
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export function formatChange(value: number): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${new Intl.NumberFormat("ko-KR").format(value)}`
}

/** ISO 또는 HH:mm:ss 문자열 → "MM/DD HH:mm" 또는 "오늘 HH:mm". */
export function formatCollectorTime(raw: string): string {
  if (!raw) return ""
  // 이미 "HH:mm:ss" 또는 "HH:mm" 형태
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) return raw.slice(0, 5)
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  if (isToday) return `오늘 ${hh}:${mm}`
  const M = String(d.getMonth() + 1).padStart(2, "0")
  const D = String(d.getDate()).padStart(2, "0")
  return `${M}/${D} ${hh}:${mm}`
}

/** YYYYMMDD → "YYYY-MM-DD" */
export function formatDateStr(d: string): string {
  if (d.length !== 8) return d
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
}
