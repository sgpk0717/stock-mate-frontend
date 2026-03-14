import { useEffect, useRef, useState } from "react"
import Markdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Term } from "@/components/ui/term"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStrategies } from "@/hooks/queries"
import {
  useCreateSession,
  useFinalizeStrategy,
  useSendMessage,
} from "@/hooks/queries/use-agent"
import type { BacktestStrategy } from "@/types"
import type { ChatMessage } from "@/types/agent"

interface StrategyChatProps {
  onStrategyReady: (strategy: BacktestStrategy, explanation: string) => void
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "안녕하세요! 원하시는 매매 전략을 자유롭게 설명해주세요.\n\n예시:\n- \"RSI 30 이하이고 거래량 2배 이상이면 매수\"\n- \"골든크로스 발생 시 분할매수, 5% 손절\"\n- \"MACD 시그널 크로스 + 볼린저밴드 하단 매수\"",
  timestamp: "",
}

function formatTime(ts: string): string {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
}

function StrategyChat({ onStrategyReady }: StrategyChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [strategyDraft, setStrategyDraft] = useState<BacktestStrategy | null>(
    null,
  )
  const [selectedPreset, setSelectedPreset] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: presets } = useStrategies()
  const createSessionMutation = useCreateSession()
  useSendMessage(sessionId)
  const finalizeMutation = useFinalizeStrategy(sessionId)

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isSending])

  // textarea 자동 높이 조절
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  // AI 모드로 전환 시 세션 자동 생성
  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId
    const res = await createSessionMutation.mutateAsync()
    setSessionId(res.session_id)
    return res.session_id
  }

  async function handleSendMessage() {
    const text = input.trim()
    if (!text || isSending) return

    setInput("")
    setIsSending(true)

    // textarea 높이 리셋
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    // 사용자 메시지를 즉시 UI에 추가 (낙관적 업데이트)
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const sid = await ensureSession()
      const { sendAgentMessage } = await import("@/api/agents")
      const response = await sendAgentMessage(sid, text)

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response.content,
        timestamp: response.timestamp,
        strategy_draft: response.strategy_draft,
      }
      setMessages((prev) => [...prev, assistantMsg])

      if (response.strategy_draft) {
        setStrategyDraft(response.strategy_draft as BacktestStrategy)
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `오류가 발생했습니다: ${(err as Error).message}`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  function handlePresetSelect(name: string) {
    setSelectedPreset(name)
    const preset = presets?.find((p) => p.name === name)
    if (preset) {
      onStrategyReady(preset.strategy, preset.description)
    }
  }

  async function handleFinalize() {
    if (!strategyDraft) return

    if (sessionId) {
      try {
        const res = await finalizeMutation.mutateAsync()
        onStrategyReady(res.strategy, res.message)
      } catch {
        // finalize 실패 시 로컬 draft로 fallback
        onStrategyReady(strategyDraft, "AI 대화를 통해 생성된 전략입니다.")
      }
    } else {
      onStrategyReady(strategyDraft, "AI 대화를 통해 생성된 전략입니다.")
    }
  }

  function handleNewChat() {
    setSessionId(null)
    setMessages([])
    setStrategyDraft(null)
    setInput("")
    setIsSending(false)
  }

  // 표시할 메시지 목록 (웰컴 메시지 + 실제 메시지)
  const displayMessages =
    messages.length > 0 ? messages : [WELCOME_MESSAGE]

  return (
    <Card className="flex flex-col" data-tour="bt-strategy-chat">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">전략 설정</CardTitle>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleNewChat}
            >
              새 대화
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
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
          <span className="text-xs text-muted-foreground">또는 AI 대화</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* 대화 영역 — 항상 표시 */}
        <div className="flex h-80 flex-col overflow-y-auto rounded-md border bg-muted/30 p-3">
          <div className="flex-1 space-y-3">
            {displayMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    AI
                  </div>
                )}
                <div className="max-w-[80%]">
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border bg-background"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none select-text dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-headings:text-sm prose-hr:my-2">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <p className="select-text whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}
                  </div>
                  {msg.timestamp && (
                    <p
                      className={`mt-0.5 text-[10px] text-muted-foreground ${
                        msg.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* 타이핑 인디케이터 */}
            {isSending && (
              <div className="flex justify-start">
                <div className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  AI
                </div>
                <div className="rounded-lg border bg-background px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 전략 초안 미리보기 */}
        {strategyDraft && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="mb-2 text-xs font-medium text-primary">
              전략 초안
            </p>
            <div className="space-y-1 text-xs">
              <p>
                <span className="text-muted-foreground">매수:</span>{" "}
                {strategyDraft.buy_conditions
                  .map(
                    (c) =>
                      `${c.indicator}(${Object.values(c.params ?? {}).join(",")}) ${c.op} ${c.value}`,
                  )
                  .join(` ${strategyDraft.buy_logic} `)}
              </p>
              <p>
                <span className="text-muted-foreground">매도:</span>{" "}
                {strategyDraft.sell_conditions
                  .map(
                    (c) =>
                      `${c.indicator}(${Object.values(c.params ?? {}).join(",")}) ${c.op} ${c.value}`,
                  )
                  .join(` ${strategyDraft.sell_logic} `)}
              </p>
              {strategyDraft.position_sizing &&
                strategyDraft.position_sizing.mode !== "fixed" && (
                  <p>
                    <span className="text-muted-foreground"><Term>포지션 사이징</Term>:</span>{" "}
                    {strategyDraft.position_sizing.mode}
                  </p>
                )}
              {strategyDraft.scaling?.enabled && (
                <p>
                  <span className="text-muted-foreground"><Term>분할매매</Term>:</span>{" "}
                  {(strategyDraft.scaling.initial_pct ?? 0.5) * 100}% 1차 진입
                </p>
              )}
              {(strategyDraft.risk_management?.stop_loss_pct ||
                strategyDraft.risk_management?.trailing_stop_pct) && (
                <p>
                  <span className="text-muted-foreground"><Term>리스크 관리</Term>:</span>{" "}
                  {strategyDraft.risk_management.stop_loss_pct &&
                    <><Term>손절</Term> {strategyDraft.risk_management.stop_loss_pct}%</>}
                  {strategyDraft.risk_management.stop_loss_pct &&
                    strategyDraft.risk_management.trailing_stop_pct &&
                    " / "}
                  {strategyDraft.risk_management.trailing_stop_pct &&
                    <><Term>트레일링</Term> {strategyDraft.risk_management.trailing_stop_pct}%</>}
                </p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleFinalize}
                disabled={finalizeMutation.isPending}
              >
                {finalizeMutation.isPending ? "확정 중..." : "전략 확정"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => textareaRef.current?.focus()}
              >
                계속 수정
              </Button>
            </div>
          </div>
        )}

        {/* 입력 영역 */}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={1}
            style={{ maxHeight: "96px" }}
            placeholder="전략을 설명해주세요... (Shift+Enter: 줄바꿈)"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={handleSendMessage}
            disabled={!input.trim() || isSending}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default StrategyChat
