import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSectorSearch } from "@/hooks/queries/use-sector"
import { cn } from "@/lib/utils"

interface SectorSearchProps {
  onSelectSymbol?: (symbol: string) => void
}

function SectorSearch({ onSelectSymbol }: SectorSearchProps) {
  const [query, setQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { data: results, isLoading } = useSectorSearch(searchQuery)

  function handleSearch() {
    const q = query.trim()
    if (q.length >= 2) {
      setSearchQuery(q)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">섹터 검색</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="예: 반도체, 2차전지, AI"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={query.trim().length < 2 || isLoading}
          >
            {isLoading ? "검색 중..." : "검색"}
          </Button>
        </div>

        {results && results.length > 0 && (
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.symbol}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm",
                  "hover:bg-muted transition-colors",
                )}
                onClick={() => onSelectSymbol?.(r.symbol)}
              >
                <div className="min-w-0">
                  <span className="font-medium">{r.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {r.symbol}
                  </span>
                  {r.sector && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {r.sector}
                    </span>
                  )}
                </div>
                <span className="ml-2 shrink-0 text-xs tabular-nums text-primary">
                  {(r.similarity * 100).toFixed(0)}%
                </span>
              </button>
            ))}
          </div>
        )}

        {results && results.length === 0 && searchQuery && (
          <p className="text-center text-xs text-muted-foreground">
            검색 결과가 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default SectorSearch
