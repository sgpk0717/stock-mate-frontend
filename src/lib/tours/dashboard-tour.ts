import type { DriveStep } from "driver.js"

export const dashboardTourSteps: DriveStep[] = [
  {
    element: '[data-tour="dash-summary"]',
    popover: {
      title: "계좌 요약",
      description:
        "총 평가자산, 투자원금, 예수금, 평가손익을 한눈에 확인할 수 있어요.\n" +
        "평가손익이 양수면 초록색, 음수면 빨간색으로 표시됩니다.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="dash-chart"]',
    popover: {
      title: "실시간 차트",
      description:
        "선택된 종목의 실시간 틱 차트가 표시돼요. " +
        "WebSocket으로 들어오는 체결가를 실시간으로 그려줍니다.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="dash-holdings"]',
    popover: {
      title: "보유 종목",
      description:
        "현재 보유 중인 종목의 수량, 평균단가, 현재가, 손익을 확인할 수 있어요. " +
        "수익률은 뱃지로 표시됩니다.",
      side: "top",
      align: "start",
    },
  },
]
