import type { DriveStep } from "driver.js"

export const workflowTourSteps: DriveStep[] = [
  {
    element: '[data-tour="wf-header"]',
    popover: {
      title: "워크플로우 & 긴급 정지",
      description:
        "자동매매 워크플로우의 전체 상태를 관리하는 곳이에요. " +
        "긴급 정지 버튼을 누르면 모든 포지션이 즉시 청산됩니다.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="wf-status-cards"]',
    popover: {
      title: "현재 상태",
      description:
        "• Phase: 지금 무엇을 하고 있는지 (장전준비, 매매, 리뷰 등)\n" +
        "• PnL: 오늘의 수익/손실률\n" +
        "• 거래 수: 오늘 실행된 매매 건수",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="wf-factor-info"]',
    popover: {
      title: "팩터 & 마이닝 현황",
      description:
        "현재 매매에 사용 중인 최적 알파 팩터와 " +
        "AI 마이닝(새 팩터 탐색) 진행 상황을 보여줘요.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="wf-manual-triggers"]',
    popover: {
      title: "수동 트리거",
      description:
        "각 Phase를 수동으로 실행할 수 있어요.\n" +
        "• pre_market: 장 시작 전 준비\n" +
        "• market_open: 매매 시작\n" +
        "• market_close: 장 마감 처리\n" +
        "• review: 일일 리뷰\n" +
        "• mining: 알파 팩터 탐색\n" +
        "평소엔 자동으로 돌아가니 건드릴 필요 없어요.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="wf-history"]',
    popover: {
      title: "히스토리",
      description:
        "최근 30일간의 워크플로우 실행 이력이에요. " +
        "날짜별 Phase, PnL, 거래 수, 성공/실패 상태를 확인할 수 있어요.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="wf-events"]',
    popover: {
      title: "이벤트 로그",
      description:
        "히스토리에서 행을 클릭하면 상세 이벤트 로그가 나타나요. " +
        "시스템에서 발생한 모든 이벤트가 시간순으로 기록됩니다.",
      side: "top",
      align: "start",
    },
  },
]
