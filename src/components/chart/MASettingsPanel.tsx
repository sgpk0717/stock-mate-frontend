import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import ColorPicker from "@/components/ui/color-picker"
import type { MALineConfig } from "@/types"

interface MASettingsPanelProps {
  configs: MALineConfig[]
  onChange: (configs: MALineConfig[]) => void
}

const LINE_WIDTH_OPTIONS = [1, 2, 3] as const
const LINE_STYLE_OPTIONS = [
  { value: 0, label: "실선", preview: "─────" },
  { value: 1, label: "점선", preview: "· · · · ·" },
  { value: 2, label: "파선", preview: "── ── ──" },
  { value: 3, label: "긴파선", preview: "───  ───" },
] as const

const NEXT_COLORS = [
  "#ec4899", "#06b6d4", "#84cc16", "#f59e0b",
  "#6366f1", "#14b8a6", "#e11d48", "#0ea5e9",
]

let nextId = 100

function MASettingsPanel({ configs, onChange }: MASettingsPanelProps) {
  function updateConfig(id: string, patch: Partial<MALineConfig>) {
    onChange(configs.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  function removeConfig(id: string) {
    onChange(configs.filter((c) => c.id !== id))
  }

  function addConfig() {
    const usedPeriods = new Set(configs.map((c) => c.period))
    const suggestions = [5, 10, 20, 60, 120, 200, 250]
    const period = suggestions.find((p) => !usedPeriods.has(p)) ?? 30
    const color = NEXT_COLORS[configs.length % NEXT_COLORS.length]
    nextId++
    onChange([
      ...configs,
      {
        id: String(nextId),
        period,
        color,
        lineWidth: 1,
        lineStyle: 0,
        visible: true,
      },
    ])
  }

  return (
    <div className="space-y-2 min-w-[340px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">
          이동평균선 설정
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={addConfig}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* 헤더 */}
      <div className="grid grid-cols-[28px_52px_28px_56px_72px_24px] gap-1.5 items-center px-0.5">
        <span />
        <span className="text-[10px] text-muted-foreground">기간</span>
        <span className="text-[10px] text-muted-foreground">색</span>
        <span className="text-[10px] text-muted-foreground">굵기</span>
        <span className="text-[10px] text-muted-foreground">스타일</span>
        <span />
      </div>

      {configs.map((config) => (
        <div
          key={config.id}
          className="grid grid-cols-[28px_52px_28px_56px_72px_24px] gap-1.5 items-center px-0.5"
        >
          {/* visible 토글 */}
          <Switch
            checked={config.visible}
            onCheckedChange={(v) => updateConfig(config.id, { visible: v })}
            className="scale-75"
          />

          {/* 기간 */}
          <Input
            type="number"
            min={2}
            max={500}
            value={config.period}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (val >= 2 && val <= 500) {
                updateConfig(config.id, { period: val })
              }
            }}
            className="h-7 px-1.5 text-xs text-center"
          />

          {/* 색상 피커 */}
          <ColorPicker
            color={config.color}
            onChange={(c) => updateConfig(config.id, { color: c })}
          />

          {/* 선 굵기 */}
          <select
            value={config.lineWidth}
            onChange={(e) =>
              updateConfig(config.id, { lineWidth: Number(e.target.value) })
            }
            className="h-7 rounded border border-input bg-background px-1 text-xs"
          >
            {LINE_WIDTH_OPTIONS.map((w) => (
              <option key={w} value={w}>
                {w}px
              </option>
            ))}
          </select>

          {/* 선 스타일 */}
          <select
            value={config.lineStyle}
            onChange={(e) =>
              updateConfig(config.id, { lineStyle: Number(e.target.value) })
            }
            className="h-7 rounded border border-input bg-background px-1 text-xs"
          >
            {LINE_STYLE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* 삭제 */}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeConfig(config.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {configs.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          [+] 버튼으로 이동평균선을 추가하세요
        </p>
      )}
    </div>
  )
}

export default MASettingsPanel
