import { getLabel } from "./indicator-labels"

/* ── Pearson correlation (single-pass) ── */

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 3) return 0

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0

  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXY += x[i] * y[i]
    sumX2 += x[i] * x[i]
    sumY2 += y[i] * y[i]
  }

  const denom = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  )
  if (denom <= 1e-10) return 0

  return (n * sumXY - sumX * sumY) / denom
}

/* ── Spearman correlation (rank-based) ── */

function rankArray(arr: number[]): number[] {
  const n = arr.length
  const indexed = arr.map((v, i) => ({ v, i }))
  indexed.sort((a, b) => a.v - b.v)

  const ranks = new Array<number>(n)
  let i = 0
  while (i < n) {
    let j = i
    while (j < n - 1 && indexed[j + 1].v === indexed[i].v) j++
    // average rank for tied values (1-based)
    const avgRank = (i + j) / 2 + 1
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].i] = avgRank
    }
    i = j + 1
  }
  return ranks
}

export function spearmanCorrelation(x: number[], y: number[]): number {
  if (x.length < 3) return 0
  return pearsonCorrelation(rankArray(x), rankArray(y))
}

/* ── All-variable correlation against pnl_pct ── */

export interface CorrelationResult {
  variable: string
  label: string
  pearson: number
  spearman: number
  n: number
}

export function computeAllCorrelations(
  trades: Array<{
    pnl_pct?: number
    entry_snapshot?: Record<string, number | Record<string, number>> | null
  }>,
): CorrelationResult[] {
  // Collect all variable keys across trades
  const variableData = new Map<string, { vals: number[]; pnls: number[] }>()

  for (const t of trades) {
    if (t.pnl_pct == null) continue
    const fv = t.entry_snapshot?.factor_variables
    if (!fv || typeof fv !== "object") continue

    const vars = fv as Record<string, number>
    for (const [key, val] of Object.entries(vars)) {
      if (typeof val !== "number" || !isFinite(val)) continue
      let entry = variableData.get(key)
      if (!entry) {
        entry = { vals: [], pnls: [] }
        variableData.set(key, entry)
      }
      entry.vals.push(val)
      entry.pnls.push(t.pnl_pct)
    }
  }

  const results: CorrelationResult[] = []

  for (const [variable, { vals, pnls }] of variableData) {
    if (vals.length < 3) continue
    results.push({
      variable,
      label: getLabel(variable),
      pearson: pearsonCorrelation(vals, pnls),
      spearman: spearmanCorrelation(vals, pnls),
      n: vals.length,
    })
  }

  // Sort by |pearson| descending
  results.sort((a, b) => Math.abs(b.pearson) - Math.abs(a.pearson))
  return results
}

/* ── Win/Loss group statistics ── */

export interface WinLossResult {
  variable: string
  label: string
  winMean: number
  lossMean: number
  winCount: number
  lossCount: number
}

export function computeWinLossStats(
  trades: Array<{
    pnl_pct?: number
    pnl?: number
    entry_snapshot?: Record<string, number | Record<string, number>> | null
  }>,
): WinLossResult[] {
  const variableData = new Map<
    string,
    { winVals: number[]; lossVals: number[] }
  >()

  for (const t of trades) {
    if (t.pnl == null) continue
    const isWin = t.pnl >= 0
    const fv = t.entry_snapshot?.factor_variables
    if (!fv || typeof fv !== "object") continue

    const vars = fv as Record<string, number>
    for (const [key, val] of Object.entries(vars)) {
      if (typeof val !== "number" || !isFinite(val)) continue
      let entry = variableData.get(key)
      if (!entry) {
        entry = { winVals: [], lossVals: [] }
        variableData.set(key, entry)
      }
      if (isWin) {
        entry.winVals.push(val)
      } else {
        entry.lossVals.push(val)
      }
    }
  }

  const results: WinLossResult[] = []

  for (const [variable, { winVals, lossVals }] of variableData) {
    const winMean =
      winVals.length > 0
        ? winVals.reduce((a, b) => a + b, 0) / winVals.length
        : 0
    const lossMean =
      lossVals.length > 0
        ? lossVals.reduce((a, b) => a + b, 0) / lossVals.length
        : 0

    results.push({
      variable,
      label: getLabel(variable),
      winMean,
      lossMean,
      winCount: winVals.length,
      lossCount: lossVals.length,
    })
  }

  // Sort by absolute difference in means descending
  results.sort(
    (a, b) => Math.abs(b.winMean - b.lossMean) - Math.abs(a.winMean - a.lossMean),
  )
  return results
}
