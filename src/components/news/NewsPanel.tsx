import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNewsArticles, useNewsSentiment, useCollectNews } from "@/hooks/queries/use-news"
import SentimentBadge from "./SentimentBadge"
import NewsSentimentChart from "./NewsSentimentChart"

interface NewsPanelProps {
  symbol: string | null
}

const SOURCE_LABELS: Record<string, string> = {
  naver: "네이버",
  dart: "DART",
  bigkinds: "BigKinds",
}

function NewsPanel({ symbol }: NewsPanelProps) {
  const { data: sentimentData } = useNewsSentiment(symbol)
  const { data: articles } = useNewsArticles(symbol)
  const collectMutation = useCollectNews()

  function handleCollect() {
    if (!symbol) return
    collectMutation.mutate({ symbols: [symbol], days: 7 })
  }

  if (!symbol) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          종목을 선택하면 뉴스 감성 분석을 볼 수 있습니다.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">뉴스 감성</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleCollect}
            disabled={collectMutation.isPending}
          >
            {collectMutation.isPending ? "수집 중..." : "뉴스 수집"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 감성 차트 */}
        {sentimentData && sentimentData.length > 0 && (
          <NewsSentimentChart data={sentimentData} />
        )}

        {/* 수집 결과 */}
        {collectMutation.isSuccess && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-2 text-xs">
            수집 {collectMutation.data.collected}건 / 분석{" "}
            {collectMutation.data.analyzed}건
          </div>
        )}

        {/* 뉴스 목록 */}
        {articles && articles.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              최근 뉴스
            </p>
            <div className="max-h-60 space-y-1.5 overflow-y-auto">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="flex items-start gap-2 rounded-md border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs font-medium hover:text-primary"
                    >
                      {art.title}
                    </a>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{SOURCE_LABELS[art.source] ?? art.source}</span>
                      <span>
                        {new Date(art.published_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>
                  <SentimentBadge score={art.sentiment_score} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            뉴스가 없습니다. 수집 버튼을 눌러주세요.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default NewsPanel
