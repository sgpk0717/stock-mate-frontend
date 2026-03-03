import { memo, useMemo } from "react"

import { GLOSSARY, GLOSSARY_KEYS_SORTED } from "@/lib/glossary"
import { useAppStore } from "@/stores/use-app-store"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface GlossaryTextProps {
  text: string
  className?: string
}

type Segment = { type: "text"; value: string } | { type: "term"; value: string }

/** longest-first greedy 매칭으로 텍스트를 세그먼트로 분할 */
function splitByGlossary(text: string): Segment[] {
  const segments: Segment[] = []
  let remaining = text

  while (remaining.length > 0) {
    let matched = false
    for (const key of GLOSSARY_KEYS_SORTED) {
      const idx = remaining.indexOf(key)
      if (idx === 0) {
        segments.push({ type: "term", value: key })
        remaining = remaining.slice(key.length)
        matched = true
        break
      }
      if (idx > 0) {
        segments.push({ type: "text", value: remaining.slice(0, idx) })
        segments.push({ type: "term", value: key })
        remaining = remaining.slice(idx + key.length)
        matched = true
        break
      }
    }
    if (!matched) {
      segments.push({ type: "text", value: remaining })
      remaining = ""
    }
  }

  return segments
}

/**
 * 동적 텍스트에서 glossary 키워드를 자동 감지하여 툴팁 적용.
 * - 전문가 모드: 텍스트 그대로
 * - 초보자 모드: 매칭된 용어에 점선 밑줄 + 호버 설명
 */
const GlossaryText = memo(function GlossaryText({
  text,
  className,
}: GlossaryTextProps) {
  const expertMode = useAppStore((s) => s.expertMode)

  const segments = useMemo(() => {
    if (expertMode) return null
    return splitByGlossary(text)
  }, [text, expertMode])

  if (expertMode || !segments) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.value}</span>
        const explanation = GLOSSARY[seg.value]
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span className="glossary-term">{seg.value}</span>
            </TooltipTrigger>
            <TooltipContent>{explanation}</TooltipContent>
          </Tooltip>
        )
      })}
    </span>
  )
})

export { GlossaryText }
