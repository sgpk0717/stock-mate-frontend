import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAIStrategy, useStrategies } from "@/hooks/queries"
import type { BacktestStrategy } from "@/types"

interface BacktestChatProps {
  onStrategyReady: (strategy: BacktestStrategy, explanation: string) => void
}

function BacktestChat({ onStrategyReady }: BacktestChatProps) {
  const [prompt, setPrompt] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const { data: presets } = useStrategies()
  const aiMutation = useAIStrategy()

  function handleAIGenerate() {
    if (!prompt.trim()) return
    aiMutation.mutate(prompt, {
      onSuccess: (res) => {
        onStrategyReady(res.strategy, res.explanation)
      },
    })
  }

  function handlePresetSelect(name: string) {
    setSelectedPreset(name)
    const preset = presets?.find((p) => p.name === name)
    if (preset) {
      onStrategyReady(preset.strategy, preset.description)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAIGenerate()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">전략 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 프리셋 선택 */}
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">
            프리셋 전략
          </label>
          <Select value={selectedPreset} onValueChange={handlePresetSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="프리셋 선택..." />
            </SelectTrigger>
            <SelectContent>
              {presets?.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">또는 AI 생성</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* AI 자연어 입력 */}
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">
            자연어로 전략 설명
          </label>
          <textarea
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={3}
            placeholder="예: RSI 30 이하이고 거래량이 평소 2배 이상이면 매수, RSI 70 이상이면 매도"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleAIGenerate}
          disabled={!prompt.trim() || aiMutation.isPending}
        >
          {aiMutation.isPending ? "AI 전략 생성 중..." : "AI 전략 생성"}
        </Button>

        {aiMutation.isError && (
          <p className="text-xs text-destructive">
            {(aiMutation.error as Error).message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default BacktestChat
