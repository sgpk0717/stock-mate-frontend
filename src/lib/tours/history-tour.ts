import type { DriveStep } from "driver.js"

export const historyTourSteps: DriveStep[] = [
  {
    element: '[data-tour="hist-summary"]',
    popover: {
      title: "주문 통계",
      description:
        "전체 주문 건수, 체결 건수, 대기 건수를 한눈에 확인할 수 있어요.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="hist-filters"]',
    popover: {
      title: "필터",
      description:
        "매수/매도 구분과 체결 상태(대기/체결/취소/거부)로 " +
        "원하는 주문만 필터링할 수 있어요.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="hist-table"]',
    popover: {
      title: "주문내역 테이블",
      description:
        "주문일시, 종목, 매수/매도 구분, 주문 유형(시장가/지정가), " +
        "가격, 수량, 금액, 상태를 상세하게 확인할 수 있어요.",
      side: "top",
      align: "start",
    },
  },
]
