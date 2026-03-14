import type { DriveStep } from "driver.js"

export const backtestTourSteps: DriveStep[] = [
  {
    element: '[data-tour="bt-strategy-chat"]',
    popover: {
      title: "AI 전략 대화",
      description:
        "AI에게 자연어로 전략을 설명하면 자동으로 만들어줘요.\n" +
        '예: "RSI 30 이하면 매수, 70 이상이면 매도"',
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="bt-config"]',
    popover: {
      title: "백테스트 설정",
      description:
        "종목, 기간, 초기 자본금 등 백테스트 조건을 설정하세요. " +
        "프리셋 전략을 선택하면 빠르게 시작할 수 있어요.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="bt-advanced"]',
    popover: {
      title: "고급 설정",
      description:
        "포지션 사이징(한 번에 얼마나 살지), 분할매매(나눠서 사기), " +
        "손절/트레일링 스탑 등 세부 옵션을 조절할 수 있어요.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="bt-run"]',
    popover: {
      title: "백테스트 실행",
      description:
        "설정이 끝나면 이 버튼을 눌러 과거 데이터로 전략을 시뮬레이션합니다. " +
        "실행 중 진행률을 실시간으로 볼 수 있어요.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="bt-summary"]',
    popover: {
      title: "성과 요약",
      description:
        "백테스트 결과가 여기 표시돼요.\n" +
        "• 총 수익률: 전체 기간 수익\n" +
        "• MDD: 최대 낙폭 (작을수록 안전)\n" +
        "• 승률: 이긴 거래 비율\n" +
        "• Sharpe: 위험 대비 수익 효율",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="bt-equity"]',
    popover: {
      title: "수익 곡선",
      description:
        "시간에 따른 자산 변화를 그래프로 보여줘요. " +
        "우상향이면 좋은 전략, 큰 하락이 있으면 위험한 전략이에요.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="bt-history"]',
    popover: {
      title: "실행 기록",
      description:
        "이전 백테스트 결과를 다시 볼 수 있어요. " +
        "클릭하면 해당 결과가 다시 표시됩니다.",
      side: "left",
      align: "start",
    },
  },
]
