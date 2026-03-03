import CausalBadge from "@/components/alpha/CausalBadge"
import { Term } from "@/components/ui/term"
import type { AlphaFactor } from "@/types/alpha"

interface AlphaFactorTableProps {
  factors: AlphaFactor[]
  onSelect: (factor: AlphaFactor) => void
  onDelete: (factorId: string) => void
}

function AlphaFactorTable({ factors, onSelect, onDelete }: AlphaFactorTableProps) {
  if (factors.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        발견된 팩터가 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">이름</th>
            <th className="px-3 py-2 text-left font-medium">수식</th>
            <th className="px-3 py-2 text-right font-medium"><Term>IC</Term></th>
            <th className="px-3 py-2 text-right font-medium"><Term>ICIR</Term></th>
            <th className="px-3 py-2 text-right font-medium"><Term k="Sharpe">Sharpe</Term></th>
            <th className="px-3 py-2 text-center font-medium">상태</th>
            <th className="px-3 py-2 text-center font-medium"><Term>인과</Term></th>
            <th className="px-3 py-2 text-center font-medium"><Term>세대</Term></th>
            <th className="px-3 py-2 text-center font-medium" />
          </tr>
        </thead>
        <tbody>
          {factors.map((f) => (
            <tr
              key={f.id}
              className="cursor-pointer border-b transition-colors hover:bg-muted/30"
              onClick={() => onSelect(f)}
            >
              <td className="px-3 py-2 font-medium">{f.name}</td>
              <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs">
                {f.expression_str}
              </td>
              <td className="px-3 py-2 text-right">
                {f.ic_mean != null ? f.ic_mean.toFixed(4) : "—"}
              </td>
              <td className="px-3 py-2 text-right">
                {f.icir != null ? f.icir.toFixed(2) : "—"}
              </td>
              <td className="px-3 py-2 text-right">
                {f.sharpe != null ? f.sharpe.toFixed(2) : "—"}
              </td>
              <td className="px-3 py-2 text-center">
                <StatusBadge status={f.status} />
              </td>
              <td className="px-3 py-2 text-center">
                <CausalBadge
                  causalRobust={f.causal_robust}
                  effectSize={f.causal_effect_size}
                  pValue={f.causal_p_value}
                />
              </td>
              <td className="px-3 py-2 text-center text-xs">{f.generation}</td>
              <td className="px-3 py-2 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(f.id)
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    discovered: "bg-blue-100 text-blue-700",
    validated: "bg-green-100 text-green-700",
    mirage: "bg-red-100 text-red-700",
    deployed: "bg-purple-100 text-purple-700",
  }

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  )
}

export default AlphaFactorTable
