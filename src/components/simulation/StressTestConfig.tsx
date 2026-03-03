import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useScenarios, useGenerateScenario } from "@/hooks/queries"
import type {
  AgentConfig,
  ExchangeConfig,
  ScenarioConfig,
  ScenarioPreset,
  StressTestRequest,
} from "@/types/simulation"

interface StressTestConfigProps {
  onStart: (req: StressTestRequest) => void
  isRunning: boolean
}

const DEFAULT_AGENT: AgentConfig = {
  fundamental_count: 20,
  chartist_count: 30,
  noise_count: 100,
  llm_count: 0,
  llm_call_interval: 20,
}

const DEFAULT_EXCHANGE: ExchangeConfig = {
  initial_price: 50000,
  tick_size: 10,
  total_steps: 500,
  seed: null,
}

function StressTestConfig({ onStart, isRunning }: StressTestConfigProps) {
  const { data: presets } = useScenarios()
  const generateMutation = useGenerateScenario()

  const [name, setName] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<ScenarioPreset | null>(
    null,
  )
  const [scenario, setScenario] = useState<ScenarioConfig>({
    type: "flash_crash",
    params: {},
    inject_at_step: 250,
  })
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(DEFAULT_AGENT)
  const [exchangeConfig, setExchangeConfig] =
    useState<ExchangeConfig>(DEFAULT_EXCHANGE)
  const [customPrompt, setCustomPrompt] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  function handlePresetSelect(preset: ScenarioPreset) {
    setSelectedPreset(preset)
    setScenario({
      type: preset.type,
      params: preset.default_params,
      inject_at_step: Math.floor(exchangeConfig.total_steps / 2),
    })
  }

  function handleGenerate() {
    if (!customPrompt.trim()) return
    generateMutation.mutate(customPrompt, {
      onSuccess: (res) => {
        setScenario(res.scenario)
        setSelectedPreset(null)
      },
    })
  }

  function handleStart() {
    onStart({
      name: name || `${scenario.type} 테스트`,
      strategy_json: {},
      scenario,
      agent_config: agentConfig,
      exchange_config: exchangeConfig,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">스트레스 테스트 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 테스트 이름 */}
        <div className="space-y-1.5">
          <Label className="text-xs">테스트 이름</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 금리 충격 시나리오 테스트"
            className="h-8 text-sm"
          />
        </div>

        {/* 시나리오 프리셋 */}
        <div className="space-y-1.5">
          <Label className="text-xs">시나리오 선택</Label>
          <div className="grid grid-cols-2 gap-2">
            {presets?.map((preset) => (
              <button
                key={preset.type}
                onClick={() => handlePresetSelect(preset)}
                className={`rounded-md border p-2 text-left text-xs transition-colors ${
                  selectedPreset?.type === preset.type
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <p className="font-medium">{preset.name}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 커스텀 시나리오 생성 */}
        <div className="space-y-1.5">
          <Label className="text-xs">커스텀 시나리오 (AI 생성)</Label>
          <div className="flex gap-2">
            <Input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="예: 반도체 수출 규제 발표"
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !customPrompt.trim()}
              className="shrink-0"
            >
              {generateMutation.isPending ? "생성중..." : "생성"}
            </Button>
          </div>
          {generateMutation.data?.explanation && (
            <p className="text-xs text-muted-foreground">
              {generateMutation.data.explanation}
            </p>
          )}
        </div>

        {/* 시나리오 주입 시점 */}
        <div className="space-y-1.5">
          <Label className="text-xs">시나리오 주입 시점 (스텝)</Label>
          <Input
            type="number"
            value={scenario.inject_at_step}
            onChange={(e) =>
              setScenario({ ...scenario, inject_at_step: Number(e.target.value) })
            }
            className="h-8 text-sm"
          />
        </div>

        {/* 고급 설정 토글 */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {showAdvanced ? "- 고급 설정 닫기" : "+ 고급 설정"}
        </button>

        {showAdvanced && (
          <div className="space-y-3 rounded-md border p-3">
            {/* 에이전트 구성 */}
            <p className="text-xs font-medium">에이전트 구성</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">펀더멘탈</Label>
                <Input
                  type="number"
                  value={agentConfig.fundamental_count}
                  onChange={(e) =>
                    setAgentConfig({
                      ...agentConfig,
                      fundamental_count: Number(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">차티스트</Label>
                <Input
                  type="number"
                  value={agentConfig.chartist_count}
                  onChange={(e) =>
                    setAgentConfig({
                      ...agentConfig,
                      chartist_count: Number(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">노이즈</Label>
                <Input
                  type="number"
                  value={agentConfig.noise_count}
                  onChange={(e) =>
                    setAgentConfig({
                      ...agentConfig,
                      noise_count: Number(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">LLM</Label>
                <Input
                  type="number"
                  value={agentConfig.llm_count}
                  onChange={(e) =>
                    setAgentConfig({
                      ...agentConfig,
                      llm_count: Number(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* 거래소 설정 */}
            <p className="text-xs font-medium">거래소 설정</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">초기 가격</Label>
                <Input
                  type="number"
                  value={exchangeConfig.initial_price}
                  onChange={(e) =>
                    setExchangeConfig({
                      ...exchangeConfig,
                      initial_price: Number(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">틱 사이즈</Label>
                <Input
                  type="number"
                  value={exchangeConfig.tick_size}
                  onChange={(e) =>
                    setExchangeConfig({
                      ...exchangeConfig,
                      tick_size: Number(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">총 스텝</Label>
                <Input
                  type="number"
                  value={exchangeConfig.total_steps}
                  onChange={(e) =>
                    setExchangeConfig({
                      ...exchangeConfig,
                      total_steps: Number(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">시드 (랜덤)</Label>
                <Input
                  type="number"
                  value={exchangeConfig.seed ?? ""}
                  onChange={(e) =>
                    setExchangeConfig({
                      ...exchangeConfig,
                      seed: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="미설정"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* 실행 버튼 */}
        <Button onClick={handleStart} disabled={isRunning} className="w-full">
          {isRunning ? "실행 중..." : "스트레스 테스트 시작"}
        </Button>
      </CardContent>
    </Card>
  )
}

export default StressTestConfig
