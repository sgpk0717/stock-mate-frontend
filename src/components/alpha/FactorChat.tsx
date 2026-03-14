import { useEffect, useRef, useState } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  useCreateFactorChat,
  useSendFactorChatMessage,
  useSaveFactorChat,
} from "@/hooks/queries/use-alpha"
import type { AlphaFactor } from "@/types/alpha"
import { Term } from "@/components/ui/term"

interface FactorChatProps {
  factor: AlphaFactor
  onSaved: () => void
  onClose: () => void
}

interface ChatMsg {
  role: string
  content: string
  timestamp: string
}

function formatTime(ts: string): string {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
}

function MetricCard({
  label,
  value,
  fmt,
}: {
  label: React.ReactNode
  value: number | null | undefined
  fmt?: "pct" | "num"
}) {
  let display = "—"
  if (value != null) {
    if (fmt === "pct") display = `${(value * 100).toFixed(1)}%`
    else display = value.toFixed(4)
  }
  return (
    <div className="rounded border px-2 py-1 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{display}</div>
    </div>
  )
}

export default function FactorChat({
  factor,
  onSaved,
  onClose,
}: FactorChatProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [currentExpression, setCurrentExpression] = useState(
    factor.expression_str,
  )
  const [currentMetrics, setCurrentMetrics] = useState<Record<
    string,
    number
  > | null>({
    ic_mean: factor.ic_mean ?? 0,
    icir: factor.icir ?? 0,
    sharpe: factor.sharpe ?? 0,
    turnover: factor.turnover ?? 0,
    max_drawdown: factor.max_drawdown ?? 0,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const createChat = useCreateFactorChat()
  useSendFactorChatMessage(sessionId)
  const saveChat = useSaveFactorChat()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isSending])

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId
    const res = await createChat.mutateAsync(factor.id)
    setSessionId(res.session_id)
    return res.session_id
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || isSending) return

    setInput("")
    setIsSending(true)

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, timestamp: new Date().toISOString() },
    ])

    try {
      const sid = await ensureSession()
      // Need to set sessionId before calling send
      const res = await sendFactorChatMessage(sid, text)

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.content,
          timestamp: res.timestamp,
        },
      ])

      if (res.current_expression) {
        setCurrentExpression(res.current_expression)
      }
      if (res.current_metrics) {
        setCurrentMetrics(res.current_metrics)
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  async function handleSave() {
    if (!sessionId) return
    try {
      await saveChat.mutateAsync(sessionId)
      onSaved()
    } catch (err) {
      alert(
        `저장 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
      )
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* 상단: 수식 + 메트릭 */}
      <Card>
        <CardContent className="space-y-2 p-3">
          <div>
            <span className="text-[10px] text-muted-foreground">
              {currentExpression === factor.expression_str
                ? "원본 수식"
                : "수정된 수식"}
            </span>
            <p className="break-all font-mono text-xs">{currentExpression}</p>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            <MetricCard label={<Term>IC</Term>} value={currentMetrics?.ic_mean} />
            <MetricCard label={<Term>ICIR</Term>} value={currentMetrics?.icir} />
            <MetricCard
              label={<Term>Sharpe</Term>}
              value={currentMetrics?.sharpe}
              fmt="num"
            />
            <MetricCard label={<Term>Turnover</Term>} value={currentMetrics?.turnover} />
            <MetricCard
              label={<Term>MDD</Term>}
              value={currentMetrics?.max_drawdown}
              fmt="pct"
            />
          </div>
        </CardContent>
      </Card>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto rounded border p-2">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            이 팩터에 대해 질문하거나 수정을 요청하세요.
            <br />
            예: &quot;이 팩터 설명해줘&quot;, &quot;거래량 비중을 높여줘&quot;
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.role === "assistant" ? (
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-1.5 last:mb-0">{children}</p>
                    ),
                    table: ({ children }) => (
                      <table className="my-2 w-full border-collapse text-xs">
                        {children}
                      </table>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-muted/50">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="border px-2 py-1 text-left font-medium">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border px-2 py-1">{children}</td>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes("language-")
                      return isBlock ? (
                        <pre className="my-2 overflow-x-auto rounded bg-muted/80 p-2">
                          <code className="text-xs">{children}</code>
                        </pre>
                      ) : (
                        <code className="rounded bg-muted/80 px-1 py-0.5 text-xs font-mono">
                          {children}
                        </code>
                      )
                    },
                    pre: ({ children }) => <>{children}</>,
                    h3: ({ children }) => (
                      <h3 className="mb-1 mt-2 text-sm font-semibold">{children}</h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="mb-1 mt-1.5 text-xs font-semibold">{children}</h4>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-1.5 list-disc pl-4 text-xs">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-1.5 list-decimal pl-4 text-xs">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-0.5">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    hr: () => <hr className="my-2 border-muted-foreground/20" />,
                  }}
                >
                  {msg.content}
                </Markdown>
              ) : (
                msg.content
              )}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              {formatTime(msg.timestamp)}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="mb-2 text-left">
            <div className="inline-block rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              생각 중...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none rounded border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          rows={1}
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <Button size="sm" onClick={handleSend} disabled={isSending || !input.trim()}>
          전송
        </Button>
      </div>

      {/* 하단 액션 */}
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onClose}>
          닫기
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={
            !sessionId ||
            !currentExpression ||
            currentExpression === factor.expression_str ||
            saveChat.isPending
          }
        >
          {saveChat.isPending ? "저장 중..." : "새 팩터로 저장"}
        </Button>
      </div>
    </div>
  )
}

// Direct API call helper to avoid hook dependency issues
async function sendFactorChatMessage(
  sessionId: string,
  message: string,
): Promise<{
  content: string
  timestamp: string
  current_expression?: string | null
  current_metrics?: Record<string, number> | null
}> {
  const { sendFactorChatMessage: apiFn } = await import("@/api/alpha")
  return apiFn(sessionId, message)
}
