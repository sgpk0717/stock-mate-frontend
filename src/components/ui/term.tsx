import type { ReactNode } from "react"

import { GLOSSARY } from "@/lib/glossary"
import { useAppStore } from "@/stores/use-app-store"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TermProps {
  /** glossary 키 (생략 시 children 텍스트를 키로 사용) */
  k?: string
  /** glossary 대신 직접 설명 */
  desc?: string
  children: ReactNode
}

/**
 * 정적 라벨 래퍼.
 * - 전문가 모드: children 그대로 (zero overhead)
 * - 초보자 모드: 점선 밑줄 + 호버 툴팁
 */
function Term({ k, desc, children }: TermProps) {
  const expertMode = useAppStore((s) => s.expertMode)
  if (expertMode) return <>{children}</>

  const explanation =
    desc ?? (k ? GLOSSARY[k] : undefined) ?? GLOSSARY[String(children)]
  if (!explanation) return <>{children}</>

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="glossary-term">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{explanation}</TooltipContent>
    </Tooltip>
  )
}

export { Term }
