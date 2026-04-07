import { getLabel } from "./indicator-labels"

export interface FactorVariable {
  key: string
  label: string
  entryValue: number | null
  exitValue: number | null
  delta: number | null
}

/**
 * entry/exit 스냅샷에서 factor_variables 키를 추출하여
 * 진입-퇴출 비교용 배열을 반환한다.
 *
 * factor_variables가 없거나 비어있으면 빈 배열 반환.
 * exit이 없는 경우(듀얼 팩터 등) 진입 변수만 표시.
 */
export function extractFactorVariables(
  entrySnapshot: Record<string, number | Record<string, number>> | null | undefined,
  exitSnapshot: Record<string, number | Record<string, number>> | null | undefined,
): FactorVariable[] {
  const entryVars =
    entrySnapshot?.factor_variables && typeof entrySnapshot.factor_variables === "object"
      ? (entrySnapshot.factor_variables as Record<string, number>)
      : null

  const exitVars =
    exitSnapshot?.factor_variables && typeof exitSnapshot.factor_variables === "object"
      ? (exitSnapshot.factor_variables as Record<string, number>)
      : null

  if (!entryVars && !exitVars) return []

  const allKeys = [
    ...new Set([
      ...Object.keys(entryVars || {}),
      ...Object.keys(exitVars || {}),
    ]),
  ]

  if (allKeys.length === 0) return []

  return allKeys.map((key) => {
    const ev = entryVars?.[key] ?? null
    const xv = exitVars?.[key] ?? null
    const delta =
      ev != null && xv != null ? xv - ev : null

    return {
      key,
      label: getLabel(key),
      entryValue: ev,
      exitValue: xv,
      delta,
    }
  })
}
