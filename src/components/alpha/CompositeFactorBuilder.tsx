import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Term } from "@/components/ui/term"
import {
  useAlphaFactors,
  useBuildComposite,
  useCorrelation,
} from "@/hooks/queries/use-alpha"
import FactorCorrelationHeatmap from "./FactorCorrelationHeatmap"

function CompositeFactorBuilder() {
  const { data: factors = [] } = useAlphaFactors()
  const buildComposite = useBuildComposite()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [method, setMethod] = useState<"ic_weighted" | "equal_weight">(
    "ic_weighted",
  )
  const [name, setName] = useState("Composite Alpha")

  const selectedArray = [...selectedIds]
  const { data: correlation } = useCorrelation(selectedArray)

  // single 타입 팩터만 표시
  const singleFactors = factors.filter((f) => f.factor_type === "single")

  const toggleFactor = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBuild = () => {
    if (selectedIds.size < 2) return
    buildComposite.mutate(
      {
        factor_ids: selectedArray,
        method,
        name,
      },
      {
        onSuccess: (res) => {
          setSelectedIds(new Set())
          window.alert(
            `복합 팩터 생성 완료!\nIC: ${res.ic_mean?.toFixed(4) ?? "N/A"}`,
          )
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      {/* 팩터 선택 */}
      <div className="rounded-lg border p-4">
        <h4 className="mb-3 text-sm font-semibold">
          팩터 선택 ({selectedIds.size}개 선택됨)
        </h4>

        <div className="max-h-48 space-y-1 overflow-y-auto">
          {singleFactors.length === 0 ? (
            <p className="text-xs text-gray-400">
              발견된 단일 팩터가 없습니다
            </p>
          ) : (
            singleFactors.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(f.id)}
                  onChange={() => toggleFactor(f.id)}
                  className="h-3.5 w-3.5 rounded"
                />
                <span className="flex-1 truncate text-xs">{f.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  IC {f.ic_mean?.toFixed(4) ?? "N/A"}
                </Badge>
              </label>
            ))
          )}
        </div>
      </div>

      {/* 상관행렬 */}
      {correlation && selectedIds.size >= 2 && (
        <FactorCorrelationHeatmap data={correlation} />
      )}

      {/* 생성 설정 */}
      <div className="rounded-lg border p-4">
        <div className="space-y-3">
          <div>
            <Label className="text-xs"><Term>복합 팩터</Term> 이름</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-8 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">가중 방법</Label>
            <div className="mt-1 flex gap-3">
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="radio"
                  name="method"
                  checked={method === "ic_weighted"}
                  onChange={() => setMethod("ic_weighted")}
                />
                <Term>IC 가중</Term>
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="radio"
                  name="method"
                  checked={method === "equal_weight"}
                  onChange={() => setMethod("equal_weight")}
                />
                <Term>동일 가중</Term>
              </label>
            </div>
          </div>

          {buildComposite.error && (
            <p className="text-xs text-red-500">
              {buildComposite.error.message ?? "복합 팩터 생성 실패"}
            </p>
          )}

          <Button
            onClick={handleBuild}
            disabled={selectedIds.size < 2 || buildComposite.isPending}
            className="w-full"
            size="sm"
          >
            {buildComposite.isPending
              ? "생성 중..."
              : `복합 팩터 생성 (${selectedIds.size}개)`}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CompositeFactorBuilder
