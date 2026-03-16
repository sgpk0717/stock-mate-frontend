import type { DriveStep } from "driver.js"

export const orderTourSteps: DriveStep[] = [
  {
    element: '[data-tour="order-account"]',
    popover: {
      title: "모의투자 계좌",
      description:
        "가상 자금으로 매매 연습을 할 수 있어요. " +
        "총자산과 잔고가 표시되고, 초기화 버튼으로 처음부터 다시 시작할 수 있습니다.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="order-form"]',
    popover: {
      title: "주문 폼",
      description:
        "종목, 가격, 수량을 입력하고 매수 또는 매도 주문을 넣을 수 있어요. " +
        "호가창의 가격을 클릭하면 자동으로 입력됩니다.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="order-book"]',
    popover: {
      title: "호가창",
      description:
        "매도/매수 호가가 10단계로 표시돼요. " +
        "가격을 클릭하면 주문 폼에 자동으로 입력됩니다.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="order-tabs"]',
    popover: {
      title: "주문 현황",
      description:
        "미체결 탭에서 대기 중인 주문을 확인하고 취소할 수 있어요. " +
        "체결내역 탭에서는 완료된 거래를 볼 수 있습니다.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="order-positions"]',
    popover: {
      title: "보유종목",
      description:
        "모의투자로 매수한 종목의 현재 상태를 보여줘요. " +
        "평균 매수가, 현재가, 손익이 표시됩니다.",
      side: "left",
      align: "start",
    },
  },
]
