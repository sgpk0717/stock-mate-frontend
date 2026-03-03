export interface NewsSentimentDaily {
  symbol: string
  date: string
  avg_sentiment: number
  article_count: number
  event_score: number
  top_headlines: string[] | null
}

export interface NewsArticle {
  id: string
  source: "naver" | "dart" | "bigkinds"
  title: string
  url: string
  published_at: string
  sentiment_score: number | null
  sentiment_magnitude: number | null
  market_impact: number | null
}

export interface CollectResponse {
  collected: number
  analyzed: number
  scored: number
}
