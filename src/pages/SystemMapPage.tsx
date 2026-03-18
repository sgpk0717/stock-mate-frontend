import { useState } from "react"
import { useTopology } from "@/hooks/queries/use-system"
import type { TopologyNode, TopologyEdge, TopologyEvent } from "@/api/system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Server,
  Database,
  Radio,
  Cpu,
  Globe,
  Zap,
  MessageSquare,
  Terminal,
  TrendingUp,
  Activity,
  Circle,
} from "lucide-react"

// ─── 노드 레이아웃 (SVG 좌표) ─────────────────────────────

const NODE_LAYOUT: Record<string, { x: number; y: number; icon: typeof Server; label: string; color: string }> = {
  api:      { x: 480, y: 80,  icon: Server,   label: "API Server",     color: "#4056F4" },
  redis:    { x: 480, y: 260, icon: Zap,       label: "Redis",          color: "#E3B23C" },
  worker:   { x: 800, y: 260, icon: Cpu,       label: "Worker",         color: "#4056F4" },
  db:       { x: 160, y: 260, icon: Database,  label: "TimescaleDB",    color: "#6B7280" },
  mcp:      { x: 480, y: 440, icon: Radio,     label: "MCP Server",     color: "#4056F4" },
  openclaw: { x: 800, y: 440, icon: Globe,     label: "OpenClaw",       color: "#6B7280" },
}

const NODE_RADIUS = 44

// ─── 상태 배지 ─────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const color =
    status === "healthy" ? "#22c55e" :
    status === "unhealthy" ? "#ef4444" :
    "#9ca3af"
  return (
    <circle r={5} fill={color}>
      {status === "healthy" && (
        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
      )}
    </circle>
  )
}

// ─── SVG 노드 ──────────────────────────────────────────────

function SvgNode({
  id,
  node,
}: {
  id: string
  node: TopologyNode
}) {
  const layout = NODE_LAYOUT[id]
  if (!layout) return null
  const Icon = layout.icon

  return (
    <g transform={`translate(${layout.x}, ${layout.y})`}>
      {/* 배경 원 */}
      <circle r={NODE_RADIUS} fill="white" stroke={layout.color} strokeWidth={2.5} opacity={0.95} />

      {/* 상태 펄스 (healthy) */}
      {node.status === "healthy" && (
        <circle r={NODE_RADIUS} fill="none" stroke={layout.color} strokeWidth={1} opacity={0.3}>
          <animate attributeName="r" values={`${NODE_RADIUS};${NODE_RADIUS + 10};${NODE_RADIUS}`} dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      )}

      {/* unhealthy 경고 */}
      {node.status === "unhealthy" && (
        <circle r={NODE_RADIUS + 2} fill="none" stroke="#ef4444" strokeWidth={2.5}>
          <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
        </circle>
      )}

      {/* 아이콘 */}
      <foreignObject x={-14} y={-18} width={28} height={28}>
        <Icon size={28} color={layout.color} strokeWidth={1.5} />
      </foreignObject>

      {/* 레이블 (원 아래) */}
      <text y={NODE_RADIUS + 16} textAnchor="middle" fontSize={13} fontWeight={600} fill="#374151">
        {layout.label}
      </text>

      {/* 상태 점 */}
      <g transform={`translate(${NODE_RADIUS - 8}, ${-NODE_RADIUS + 8})`}>
        <StatusDot status={node.status} />
      </g>

      {/* 메트릭 (노드별) */}
      <MetricLabel id={id} node={node} />
    </g>
  )
}

function MetricLabel({ id, node }: { id: string; node: TopologyNode }) {
  let text = ""
  if (id === "redis") {
    const ops = node.ops_per_sec ?? 0
    text = Number(ops) > 0 ? `초당 ${ops}건 처리 중` : `대기 중 · ${node.memory_mb ?? 0}MB`
  } else if (id === "db") {
    const sizeMb = Number(node.db_size_mb ?? 0)
    const sizeGb = sizeMb > 1024 ? `${(sizeMb / 1024).toFixed(1)}GB` : `${sizeMb}MB`
    text = `정상 · ${sizeGb} 사용 중`
  } else if (id === "worker") {
    const n = node as Record<string, unknown>
    const phase = n.phase as string ?? "?"
    const sessions = Number(n.sessions ?? 0)
    const trades = Number(n.total_trades ?? 0)
    const mining = n.mining_running === true
    if (phase === "TRADING" && sessions > 0) {
      text = `${sessions}개 전략으로 매매 중 · ${trades}건`
    } else if (mining) {
      text = "새로운 팩터를 찾고 있어요"
    } else if (phase === "IDLE") {
      text = "대기 중"
    } else {
      text = `${phase} 진행 중`
    }
  } else if (id === "api") {
    text = "코드 수정해도 매매에 영향 없어요"
  } else if (id === "mcp") {
    const calls = node.calls_1h ?? 0
    text = Number(calls) > 0 ? `최근 1시간 ${calls}건 호출` : "OpenClaw 호출 대기 중"
  } else if (id === "openclaw") {
    text = node.status === "healthy" ? "자동 보고서 정상 작동" : "연결 끊김"
  }

  return (
    <text y={NODE_RADIUS + 30} textAnchor="middle" fontSize={11} fill="#9ca3af">
      {text}
    </text>
  )
}

// ─── 노드 상세 카드 ────────────────────────────────────────

function MiniBar({ value, max, color = "#4056F4" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{Math.round(pct)}%</span>
    </div>
  )
}

function NodeDetailCard({
  id, node, icon: Icon, layout,
}: {
  id: string
  node: TopologyNode
  icon: typeof Server
  layout: { label: string; color: string }
}) {
  const n = node as Record<string, unknown>
  const statusColor = node.status === "healthy" ? "text-green-600 border-green-300 bg-green-50" :
    node.status === "unhealthy" ? "text-red-600 border-red-300 bg-red-50" :
    "text-gray-500 border-gray-300 bg-gray-50"

  return (
    <div className="rounded-lg border p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-7 w-7 rounded-full" style={{ backgroundColor: layout.color + "15" }}>
          <Icon className="h-3.5 w-3.5" style={{ color: layout.color }} />
        </div>
        <span className="text-sm font-semibold">{layout.label}</span>
        <Badge variant="outline" className={`text-[9px] py-0 ml-auto ${statusColor}`}>
          {node.status === "healthy" ? "정상" : node.status === "unhealthy" ? "이상" : "확인 불가"}
        </Badge>
      </div>

      {/* 상세 메트릭 */}
      {id === "redis" && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>메모리</span>
            <span>{n.memory_mb ?? 0}MB / 256MB</span>
          </div>
          <MiniBar value={Number(n.memory_mb ?? 0)} max={256} color="#E3B23C" />
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <span>처리량 <b className="text-foreground">{n.ops_per_sec ?? 0}</b> ops/s</span>
            <span>키 <b className="text-foreground">{n.keys ?? 0}</b>개</span>
            <span>연결 <b className="text-foreground">{n.connected_clients ?? 0}</b></span>
          </div>
        </div>
      )}

      {id === "db" && (() => {
        const sizeMb = Number(n.db_size_mb ?? 0)
        const sizeGb = sizeMb > 1024 ? `${(sizeMb / 1024).toFixed(1)}GB` : `${sizeMb}MB`
        return (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>연결 풀</span>
              <span>{n.active_queries ?? 0}개 활성 / {n.total_connections ?? 0}개 전체</span>
            </div>
            <MiniBar value={Number(n.active_queries ?? 0)} max={Number(n.total_connections ?? 30)} color="#6B7280" />
            <p className="text-[11px] text-muted-foreground">데이터 크기 <b className="text-foreground">{sizeGb}</b></p>
          </div>
        )
      })()}

      {id === "worker" && (() => {
        const phase = n.phase as string ?? "?"
        const sessions = Number(n.sessions ?? 0)
        const trades = Number(n.total_trades ?? 0)
        const mining = n.mining_running === true
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] py-0 bg-[#4056F4]/10 text-[#4056F4] border-[#4056F4]/30">{phase}</Badge>
              {mining && <Badge className="text-[10px] py-0 bg-indigo-50 text-indigo-600 border-indigo-200">마이닝 실행 중</Badge>}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {phase === "TRADING" && sessions > 0
                ? <>매매 세션 <b className="text-foreground">{sessions}개</b> 활성 · <b className="text-foreground">{trades}건</b> 체결</>
                : phase === "MINING" && mining
                ? <>장 마감 후 알파 마이닝 진행 중</>
                : phase === "MINING"
                ? <>마이닝 대기 중</>
                : <>대기 중</>
              }
            </p>
          </div>
        )
      })()}

      {id === "api" && (
        <p className="text-[11px] text-muted-foreground">
          API 전용 서버 · 코드 수정 시 <b className="text-foreground">자동 재시작</b> · Worker/MCP에 영향 없음
        </p>
      )}

      {id === "mcp" && (
        <p className="text-[11px] text-muted-foreground">
          OpenClaw 크론잡 연결 · 최근 1시간 <b className="text-foreground">{n.calls_1h ?? 0}건</b> 도구 호출
        </p>
      )}

      {id === "openclaw" && (
        <p className="text-[11px] text-muted-foreground">
          {node.status === "healthy"
            ? <>크론잡 8개 등록 · Gateway <b className="text-foreground">정상 동작</b></>
            : <>Gateway 연결 끊김 · 크론잡 실행 불가</>
          }
        </p>
      )}
    </div>
  )
}

// ─── SVG 엣지 ──────────────────────────────────────────────

// 각 엣지의 수동 경로 정의 (겹침 완전 방지)
// 노드 좌표: api(200,120) worker(680,120) redis(440,250) db(200,380) mcp(680,380) openclaw(920,380)
const EDGE_ROUTES: Record<string, { path: string; lx: number; ly: number }> = {
  // === 노드 좌표 참고 ===
  // api(480,80) redis(480,260) worker(800,260) db(160,260) mcp(480,440) openclaw(800,440)
  // NODE_RADIUS = 44, 노드 끝 = 중심 ± 44

  // 1. API → Redis: 수직 직선
  "api→redis": {
    path: "M 480 124 L 480 216",
    lx: 510, ly: 180,
  },

  // 2. Worker → Redis: 수평, 위쪽 라인 (y=245)
  "worker→redis": {
    path: "M 756 245 L 524 245",
    lx: 640, ly: 232,
  },

  // 3. Redis → Worker: 수평, 아래쪽 라인 (y=275) — 2번과 대칭
  "redis→worker": {
    path: "M 524 275 L 756 275",
    lx: 640, ly: 288,
  },

  // 4. MCP → Redis: 수직 직선
  "mcp→redis": {
    path: "M 480 396 L 480 304",
    lx: 510, ly: 360,
  },

  // 5. Worker → DB: 오른쪽 위 → 맨 위 수평 → 왼쪽 아래 DB
  //    API 위를 지나므로 y=25 (API 위 55px 간격)
  "worker→db": {
    path: "M 844 260 L 880 260 L 880 15 L 80 15 L 80 260 L 170 260",
    lx: 480, ly: 5,
  },

  // 6. API → DB: API 왼쪽에서 나가서 DB 위쪽으로
  //    x=300에서 꺾어서 DB로 (API와 충분한 간격)
  "api→db": {
    path: "M 436 80 L 160 80 L 160 220",
    lx: 268, ly: 67,
  },

  // 7. MCP → DB: MCP 왼쪽에서 나가서 아래로 돌아 DB로
  //    y=490 (MCP 아래 50px)
  "mcp→db": {
    path: "M 436 440 L 160 440 L 160 304",
    lx: 300, ly: 457,
  },

  // 8. Worker → API: Worker 오른쪽에서 나가서 위로, API 오른쪽으로
  //    x=900 (Worker 오른쪽 100px)
  "worker→api": {
    path: "M 800 216 L 800 260 L 800 80 L 524 80",
    lx: 652, ly: 67,
  },

  // 9. OpenClaw → MCP: 수평 직선
  "openclaw→mcp": {
    path: "M 756 440 L 524 440",
    lx: 640, ly: 428,
  },
}

function SvgEdge({ edge, index }: { edge: TopologyEdge; index: number }) {
  const color =
    edge.type === "write" ? "#4056F4" :
    edge.type === "command" ? "#E3B23C" :
    edge.type === "event" ? "#E3B23C" :
    edge.type === "sse" ? "#6B7280" :
    "#d1d5db"

  const isRead = edge.type === "read"
  const dashArray = isRead ? "8 5" : undefined
  const id = `edge-${index}`
  const routeKey = `${edge.from}→${edge.to}`
  const route = EDGE_ROUTES[routeKey]

  if (!route) return null

  return (
    <g>
      <path
        id={id}
        d={route.path}
        fill="none"
        stroke={color}
        strokeWidth={isRead ? 2 : 1.5}
        strokeDasharray={dashArray}
        opacity={isRead ? 0.95 : 0.5}
      />

      {/* 파티클 */}
      <circle r={3} fill={color} opacity={0.7}>
        <animateMotion dur={`${2.5 + index * 0.2}s`} repeatCount="indefinite">
          <mpath href={`#${id}`} />
        </animateMotion>
      </circle>

      {/* 라벨 */}
      <g transform={`translate(${route.lx}, ${route.ly})`}>
        <rect
          x={-edge.label.length * 3.5 - 6}
          y={-9}
          width={edge.label.length * 7 + 12}
          height={18}
          rx={4}
          fill="white"
          opacity={0.92}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
        <text
          textAnchor="middle"
          fontSize={11}
          fill="#6B7280"
          fontWeight={500}
          dominantBaseline="central"
        >
          {edge.label}
        </text>
      </g>
    </g>
  )
}

// ─── 이벤트 피드 ───────────────────────────────────────────

function EventItem({ event }: { event: TopologyEvent }) {
  const ts = event.ts ? new Date(event.ts).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : ""

  if (event.type === "trade") {
    const side = event.side as string
    return (
      <div className="flex items-center gap-2 py-1 text-xs">
        <TrendingUp className={`h-3 w-3 shrink-0 ${side === "BUY" ? "text-green-500" : "text-red-500"}`} />
        <span className="font-mono text-muted-foreground shrink-0">{ts}</span>
        <Badge variant="outline" className={`text-[9px] py-0 ${side === "BUY" ? "text-green-600 border-green-300" : "text-red-600 border-red-300"}`}>
          {side}
        </Badge>
        <span className="text-muted-foreground truncate">{event.symbol as string} {event.qty as number}주</span>
      </div>
    )
  }

  if (event.type === "telegram") {
    return (
      <div className="flex items-center gap-2 py-1 text-xs">
        <MessageSquare className="h-3 w-3 shrink-0 text-[#E3B23C]" />
        <span className="font-mono text-muted-foreground shrink-0">{ts}</span>
        <Badge variant="outline" className="text-[9px] py-0">{event.category as string}</Badge>
        <span className="text-muted-foreground truncate">{event.caller as string}</span>
        <Badge variant="outline" className={`text-[9px] py-0 ${event.status === "success" ? "text-green-600" : "text-red-600"}`}>
          {event.status as string}
        </Badge>
      </div>
    )
  }

  if (event.type === "mcp") {
    return (
      <div className="flex items-center gap-2 py-1 text-xs">
        <Terminal className="h-3 w-3 shrink-0 text-gray-500" />
        <span className="font-mono text-muted-foreground shrink-0">{ts}</span>
        <Badge variant="outline" className="text-[9px] py-0">{event.tool as string}</Badge>
        <span className="text-muted-foreground">{event.duration_ms as number}ms</span>
        <Badge variant="outline" className={`text-[9px] py-0 ${event.status === "success" ? "text-green-600" : "text-red-600"}`}>
          {event.status as string}
        </Badge>
      </div>
    )
  }

  return null
}

// ─── 메인 페이지 ───────────────────────────────────────────

export default function SystemMapPage() {
  const { data, isLoading } = useTopology()
  const [showDebug, setShowDebug] = useState(false)

  const nodes = data?.nodes ?? {}
  const edges = data?.edges ?? []
  const events = data?.events ?? []

  // 전체 건강 상태
  const allHealthy = Object.values(nodes).every((n) => n.status === "healthy")
  const healthyCount = Object.values(nodes).filter((n) => n.status === "healthy").length
  const totalCount = Object.keys(nodes).length

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">시스템 맵</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data?.timestamp
              ? new Date(data.timestamp).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
              : "로딩 중..."
            }
            {" · 5초마다 갱신"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Circle
            className={`h-3 w-3 ${allHealthy ? "text-green-500 fill-green-500" : "text-yellow-500 fill-yellow-500"}`}
          />
          <span className="text-sm font-medium">
            {healthyCount}/{totalCount} 정상
          </span>
        </div>
      </div>

      {/* 토폴로지 맵 */}
      <Card>
        <CardContent className="p-4">
          <svg
            viewBox="0 0 960 520"
            className="w-full"
            style={{ maxHeight: "520px" }}
          >
            {/* 배경 그리드 */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth={0.5} />
              </pattern>
            </defs>
            <rect width="960" height="520" fill="url(#grid)" rx={8} />

            {/* 엣지 (노드 뒤에 그리기) */}
            {edges.map((edge, i) => (
              <SvgEdge key={i} edge={edge} index={i} />
            ))}

            {/* 노드 */}
            {Object.entries(nodes).map(([id, node]) => (
              <SvgNode key={id} id={id} node={node} />
            ))}

            {/* 로딩 오버레이 */}
            {isLoading && (
              <text x="460" y="210" textAnchor="middle" fontSize={14} fill="#9ca3af">
                로딩 중...
              </text>
            )}
          </svg>
        </CardContent>
      </Card>

      {/* 하단: 노드 상세 + 이벤트 피드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 노드 상세 카드 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-[#4056F4]" />
              노드 상세
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(nodes).map(([id, node]) => {
              const layout = NODE_LAYOUT[id]
              if (!layout) return null
              const Icon = layout.icon
              return <NodeDetailCard key={id} id={id} node={node} icon={Icon} layout={layout} />
            })}
          </CardContent>
        </Card>

        {/* 이벤트 피드 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-[#E3B23C]" />
              최근 이벤트
              <span className="text-xs font-normal text-muted-foreground">
                {events.length}건
              </span>
              <Button
                variant={showDebug ? "default" : "outline"}
                size="sm"
                className="ml-auto h-6 text-[10px] px-2"
                onClick={() => setShowDebug((v) => !v)}
              >
                {showDebug ? "DEBUG ON" : "INFO"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">이벤트 없음</p>
            ) : (
              <div className="space-y-0.5">
                {events.map((evt, i) => (
                  <EventItem key={i} event={evt} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
