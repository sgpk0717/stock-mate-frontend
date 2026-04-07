import { useMemo, useState } from "react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { extractFactorVariables, type FactorVariable } from "@/lib/factor-snapshot"

interface FactorVariableComparisonProps {
  entrySnapshot: Record<string, number | Record<string, number>> | null | undefined
  exitSnapshot: Record<string, number | Record<string, number>> | null | undefined
  defaultOpen?: boolean
}

function fmtNum(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "-"
  if (Math.abs(v) >= 1000)
    return v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (Math.abs(v) >= 1) return v.toFixed(2)
  return v.toFixed(4)
}

function DeltaArrow({ delta }: { delta: number | null }) {
  if (delta == null || delta === 0) return null
  return (
    <span className={cn("text-[10px]", delta > 0 ? "text-red-500" : "text-blue-500")}>
      {delta > 0 ? "\u25B2" : "\u25BC"}
    </span>
  )
}

function VariableRow({ item }: { item: FactorVariable }) {
  const deltaColor =
    item.delta == null || item.delta === 0
      ? "text-muted-foreground"
      : item.delta > 0
        ? "text-red-500"
        : "text-blue-500"

  return (
    <div className="rounded bg-muted/20 px-2.5 py-1.5">
      <div className="text-[11px] text-muted-foreground">{item.label}</div>
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-1">
          <span>{fmtNum(item.entryValue)}</span>
          {item.exitValue != null && (
            <>
              <span className="text-muted-foreground">&rarr;</span>
              <span>{fmtNum(item.exitValue)}</span>
            </>
          )}
        </div>
        {item.delta != null && (
          <div className="flex items-center gap-0.5">
            <span className={deltaColor}>
              {item.delta > 0 ? "+" : ""}
              {fmtNum(item.delta)}
            </span>
            <DeltaArrow delta={item.delta} />
          </div>
        )}
      </div>
    </div>
  )
}

function FactorVariableComparison({
  entrySnapshot,
  exitSnapshot,
  defaultOpen,
}: FactorVariableComparisonProps) {
  const variables = useMemo(
    () => extractFactorVariables(entrySnapshot, exitSnapshot),
    [entrySnapshot, exitSnapshot],
  )

  const autoOpen = defaultOpen ?? (variables.length > 0 && variables.length <= 6)
  const [open, setOpen] = useState(autoOpen)

  if (variables.length === 0) return null

  // 변수 1개: Collapsible 없이 인라인
  if (variables.length === 1) {
    return (
      <section>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          팩터 변수 비교
        </h4>
        <VariableRow item={variables[0]} />
      </section>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        {open ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        <span>팩터 변수 비교</span>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
          {variables.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 grid grid-cols-2 gap-1">
        {variables.map((v) => (
          <VariableRow key={v.key} item={v} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default FactorVariableComparison
