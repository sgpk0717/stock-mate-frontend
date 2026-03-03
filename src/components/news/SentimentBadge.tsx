interface SentimentBadgeProps {
  score: number | null
  size?: "sm" | "md"
}

function SentimentBadge({ score, size = "sm" }: SentimentBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        N/A
      </span>
    )
  }

  const isPositive = score > 0.1
  const isNegative = score < -0.1

  const colorClass = isPositive
    ? "bg-primary/10 text-primary"
    : isNegative
      ? "bg-red-50 text-red-600"
      : "bg-muted text-muted-foreground"

  const label = isPositive ? "긍정" : isNegative ? "부정" : "중립"
  const sizeClass = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs"

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${colorClass} ${sizeClass}`}>
      <span>{label}</span>
      <span className="font-medium">{score > 0 ? "+" : ""}{score.toFixed(2)}</span>
    </span>
  )
}

export default SentimentBadge
