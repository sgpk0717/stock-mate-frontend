import type { DriveStep } from "driver.js"

export const positionsTourSteps: DriveStep[] = [
  {
    element: '[data-tour="pos-summary"]',
    popover: {
      title: "포지션 요약",
      description:
        "총 평가금액, 총 평가손익, 보유 종목 수를 요약 카드로 보여줘요. " +
        "투자원금과 예수금도 함께 확인할 수 있습니다.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="pos-table"]',
    popover: {
      title: "종목 상세",
      description:
        "보유 종목별로 수량, 평균단가, 현재가, 매입금액, 평가금액, " +
        "평가손익, 수익률, 포트폴리오 비중까지 상세하게 확인할 수 있어요.",
      side: "top",
      align: "start",
    },
  },
]
