import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Term } from "@/components/ui/term"
import {
  useMcpStatus,
  useMcpTools,
  useMcpAudit,
  useUpdateGovernance,
} from "@/hooks/queries"
import type { GovernanceRules, McpAuditLog } from "@/types/simulation"

const AUDIT_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  success: { label: "성공", variant: "default" },
  blocked: { label: "차단", variant: "secondary" },
  error: { label: "에러", variant: "destructive" },
}

function McpDashboard() {
  const { data: status, isLoading: statusLoading } = useMcpStatus()
  const { data: tools } = useMcpTools()
  const { data: auditLogs } = useMcpAudit({ limit: 20 })
  const updateMutation = useUpdateGovernance()

  const [editingGov, setEditingGov] = useState(false)
  const [govForm, setGovForm] = useState<Partial<GovernanceRules>>({})

  function handleEditStart() {
    if (status?.governance) {
      setGovForm({ ...status.governance })
    }
    setEditingGov(true)
  }

  function handleSave() {
    updateMutation.mutate(govForm, {
      onSuccess: () => setEditingGov(false),
    })
  }

  return (
    <div className="space-y-6">
      {/* 서버 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium"><Term>MCP</Term> 서버 상태</CardTitle>
            {statusLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <Badge variant={status?.running ? "default" : "secondary"}>
                {status?.running ? "실행중" : "중지"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {status && (
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>SSE 포트: {status.sse_port}</p>
              <p><Term>거버넌스</Term>: {status.governance.enabled ? "활성" : "비활성"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 거버넌스 규칙 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium"><Term>거버넌스</Term> 규칙</CardTitle>
            {!editingGov ? (
              <Button size="sm" variant="outline" onClick={handleEditStart}>
                편집
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingGov(false)}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "저장중..." : "저장"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingGov ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">최대 주문 수량</Label>
                <Input
                  type="number"
                  value={govForm.max_order_qty ?? 1000}
                  onChange={(e) =>
                    setGovForm({
                      ...govForm,
                      max_order_qty: Number(e.target.value),
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">허용 액션</Label>
                <Input
                  value={(govForm.allowed_actions ?? []).join(", ")}
                  onChange={(e) =>
                    setGovForm({
                      ...govForm,
                      allowed_actions: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="BUY, SELL"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={govForm.require_human_approval_real ?? true}
                  onChange={(e) =>
                    setGovForm({
                      ...govForm,
                      require_human_approval_real: e.target.checked,
                    })
                  }
                  id="human-approval"
                />
                <Label htmlFor="human-approval" className="text-xs">
                  실거래 시 수동 승인 필요
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={govForm.enabled ?? true}
                  onChange={(e) =>
                    setGovForm({ ...govForm, enabled: e.target.checked })
                  }
                  id="gov-enabled"
                />
                <Label htmlFor="gov-enabled" className="text-xs">
                  거버넌스 활성화
                </Label>
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-xs text-muted-foreground">
              {status?.governance && (
                <>
                  <p>
                    최대 주문 수량: {status.governance.max_order_qty.toLocaleString()}
                  </p>
                  <p>
                    허용 액션: {status.governance.allowed_actions.join(", ")}
                  </p>
                  <p>
                    실거래 수동 승인:{" "}
                    {status.governance.require_human_approval_real ? "예" : "아니오"}
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 등록된 도구 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            등록된 도구 ({tools?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tools?.map((tool) => (
            <div key={tool.name} className="rounded-md border p-2">
              <p className="text-xs font-medium">{tool.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {tool.description}
              </p>
            </div>
          ))}
          {(!tools || tools.length === 0) && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              등록된 도구가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 감사 로그 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium"><Term>감사 로그</Term></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditLogs?.map((log: McpAuditLog) => {
              const st = AUDIT_STATUS_MAP[log.status] ?? AUDIT_STATUS_MAP.error
              return (
                <div
                  key={log.id}
                  className="flex items-start justify-between rounded-md border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{log.tool_name}</p>
                      <Badge
                        variant={st.variant}
                        className="text-[10px]"
                      >
                        {st.label}
                      </Badge>
                    </div>
                    {log.blocked_reason && (
                      <p className="mt-0.5 text-[10px] text-destructive">
                        {log.blocked_reason}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("ko-KR")}
                      {log.execution_ms != null && ` (${log.execution_ms}ms)`}
                    </p>
                  </div>
                </div>
              )
            })}
            {(!auditLogs || auditLogs.length === 0) && (
              <p className="py-2 text-center text-xs text-muted-foreground">
                감사 로그가 없습니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default McpDashboard
