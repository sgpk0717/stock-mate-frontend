import type { DriveStep } from "driver.js"

export const tradingTourSteps: DriveStep[] = [
  {
    element: '[data-tour="trading-mode"]',
    popover: {
      title: "매매 모드",
      description:
        "모의투자(Paper)와 실거래(Real) 모드를 전환할 수 있어요. " +
        "모의투자로 충분히 검증한 후 실거래로 전환하세요.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="trading-summary"]',
    popover: {
      title: "계좌 요약",
      description:
        "KIS 계좌의 총 평가, 예수금, 손익, 보유종목 수를 보여줘요. " +
        "모의/실거래 모드에 따라 해당 계좌 정보가 표시됩니다.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="trading-context"]',
    popover: {
      title: "전략 관리",
      description:
        "백테스트에서 검증된 전략을 불러와 자동매매에 적용해요. " +
        "전략 선택 후 세션을 시작하면 30초마다 시그널을 체크합니다.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="trading-status"]',
    popover: {
      title: "실행 상태",
      description:
        "현재 실행 중인 매매 세션의 상태를 보여줘요. " +
        "세션 시작/중지와 실시간 시그널 로그를 확인할 수 있습니다.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="trading-trades"]',
    popover: {
      title: "매매 기록",
      description:
        "자동매매로 체결된 거래 내역이 표시돼요. " +
        "시각, 종목, 매수/매도 구분, 수량, 가격, 성공 여부를 확인할 수 있습니다.",
      side: "top",
      align: "start",
    },
  },
]
