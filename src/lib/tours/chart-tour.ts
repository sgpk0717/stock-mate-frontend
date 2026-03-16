import type { DriveStep } from "driver.js"

export const chartTourSteps: DriveStep[] = [
  {
    element: '[data-tour="chart-search"]',
    popover: {
      title: "종목 검색",
      description:
        "종목명이나 코드로 검색해서 차트에 표시할 종목을 바꿀 수 있어요. " +
        "옆에 현재가와 등락률이 실시간으로 표시됩니다.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="chart-intervals"]',
    popover: {
      title: "차트 인터벌",
      description:
        "월봉부터 틱 차트까지 10가지 타임프레임을 선택할 수 있어요.\n" +
        "장기 추세는 일봉/주봉, 단기 매매는 1분/3분/5분봉을 활용하세요.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="chart-indicators"]',
    popover: {
      title: "기술적 지표",
      description:
        "MA(이동평균선), RSI, MACD, BB(볼린저밴드) 지표를 켜고 끌 수 있어요.\n" +
        "MA 버튼에 마우스를 올리면 기간/색상을 세부 설정할 수 있습니다.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="chart-candle"]',
    popover: {
      title: "캔들 차트",
      description:
        "선택한 인터벌의 OHLCV 캔들 차트가 표시돼요. " +
        "우측/하단 모서리를 드래그하면 차트 크기를 조절할 수 있습니다.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="chart-orderbook"]',
    popover: {
      title: "호가창",
      description:
        "매도/매수 10단계 호가와 잔량이 표시돼요. " +
        "실시간 WebSocket으로 갱신됩니다.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="chart-trades"]',
    popover: {
      title: "체결 정보",
      description:
        "최근 체결된 거래의 가격, 수량, 시간을 실시간으로 보여줘요. " +
        "매수 체결은 빨간색, 매도 체결은 파란색으로 구분됩니다.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="chart-news"]',
    popover: {
      title: "뉴스",
      description:
        "이 버튼을 누르면 선택한 종목의 뉴스와 AI 감성 분석 결과를 볼 수 있어요. " +
        "긍정/부정 뉴스가 차트 아래에 표시됩니다.",
      side: "bottom",
      align: "start",
    },
  },
]
