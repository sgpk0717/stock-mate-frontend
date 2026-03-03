interface CausalBadgeProps {
  causalRobust: boolean | null
  effectSize?: number | null
  pValue?: number | null
}

function CausalBadge({ causalRobust, effectSize, pValue }: CausalBadgeProps) {
  if (causalRobust === null || causalRobust === undefined) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
        title="인과 검증이 아직 수행되지 않았습니다"
      >
        미검증
      </span>
    )
  }

  if (causalRobust) {
    const tooltip = [
      "인과적으로 유효한 팩터",
      effectSize != null ? `Effect: ${effectSize.toFixed(6)}` : null,
      pValue != null ? `p-value: ${pValue.toFixed(4)}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    return (
      <span
        className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
        title={tooltip}
      >
        검증됨
      </span>
    )
  }

  const tooltip = [
    "교란 변수에 의한 허위 상관 (Factor Mirage)",
    effectSize != null ? `Effect: ${effectSize.toFixed(6)}` : null,
    pValue != null ? `p-value: ${pValue.toFixed(4)}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  return (
    <span
      className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700"
      title={tooltip}
    >
      미라지
    </span>
  )
}

export default CausalBadge
