const INDICATOR_LABELS: Record<string, string> = {
  rsi: "RSI",
  macd_hist: "MACD Hist",
  macd_line: "MACD Line",
  macd_signal: "MACD Signal",
  volume_ratio: "거래량 비율",
  close: "종가",
  avg_price: "평균단가",
  highest_price: "고점",
  loss_pct: "손실률",
  drop_pct: "낙폭",
  gain_pct: "수익률",
  atr: "ATR",
  stop_line: "스탑라인",
  sentiment_score: "감성 점수",
  article_count: "기사 수",
  event_score: "이벤트 점수",
  bb_upper: "BB 상단",
  bb_lower: "BB 하단",
  bb_middle: "BB 중단",
  golden_cross: "골든크로스",
  dead_cross: "데드크로스",
  // 팩터 백테스트 스냅샷
  factor_rank: "팩터 랭크",
  factor_rank_pct: "팩터 상위(%)",
  rank_position: "랭크 순위",
  total_candidates: "전체 종목 수",
  target_count: "매수 대상 수",
  factor_value: "팩터 값",
  max_gain_pct: "보유 중 최고(%)",
  max_loss_pct: "보유 중 최저(%)",
  exit_price_close: "퇴출 시 종가",
  // 팩터 변수
  open: "시가",
  high: "고가",
  low: "저가",
  volume: "거래량",
  returns_1d: "일간 수익률",
  returns_5d: "5일 수익률",
  foreign_net_norm: "외국인 순매수",
  inst_net_norm: "기관 순매수",
  retail_net_norm: "개인 순매수",
  sector_return: "섹터 수익률",
  sector_rel_strength: "섹터 상대강도",
  sector_rank: "섹터 랭크",
  margin_rate: "신용잔고율",
  short_balance_rate: "공매도잔고율",
  short_volume_ratio: "공매도비율",
  pgm_net_norm: "프로그램 순매수",
  pgm_buy_ratio: "프로그램 매수비율",
}

export function getLabel(key: string): string {
  if (INDICATOR_LABELS[key]) return INDICATOR_LABELS[key]
  // sma_20, ema_10, atr_14 등 동적 이름
  const match = key.match(/^(sma|ema|atr)_(\d+)$/)
  if (match) return `${match[1].toUpperCase()}(${match[2]})`
  // lag_close_3 등
  const lagMatch = key.match(/^lag_(.+?)_(\d+)$/)
  if (lagMatch) return `${getLabel(lagMatch[1])} (${lagMatch[2]}일전)`
  return key
}
