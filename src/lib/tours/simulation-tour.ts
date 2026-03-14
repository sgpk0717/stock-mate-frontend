import type { DriveStep } from "driver.js"

export const simulationTourSteps: DriveStep[] = [
  {
    element: '[data-tour="sim-tabs"]',
    popover: {
      title: "시뮬레이션 탭",
      description:
        "시뮬레이션은 두 가지가 있어요.\n" +
        "• 스트레스 테스트: 극단적 시장 상황에서 전략이 어떻게 되는지 실험\n" +
        "• MCP 대시보드: AI 에이전트가 사용하는 데이터 버스 현황",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="sim-scenario"]',
    popover: {
      title: "시나리오 선택",
      description:
        "금리 충격, 유동성 위기, 플래시 크래시 등 미리 만들어진 시나리오를 선택하세요. " +
        "각 시나리오는 실제 금융 위기를 모방합니다.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="sim-custom"]',
    popover: {
      title: "커스텀 시나리오",
      description:
        'AI에게 원하는 시나리오를 자연어로 요청할 수도 있어요.\n예: "반도체 수출 규제 발표"',
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="sim-advanced"]',
    popover: {
      title: "고급 설정",
      description:
        "가상 시장에 참여하는 에이전트(펀더멘탈, 차티스트, 노이즈 등)의 비율과 " +
        "거래소 초기 가격, 총 시뮬레이션 스텝 수를 조절할 수 있어요.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="sim-run"]',
    popover: {
      title: "시뮬레이션 실행",
      description: "설정이 끝나면 이 버튼을 눌러 시뮬레이션을 시작합니다.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="sim-metrics"]',
    popover: {
      title: "결과 메트릭스",
      description:
        "시뮬레이션 결과를 한눈에 볼 수 있어요.\n" +
        "• 전략 손익: 시뮬레이션 중 전략의 수익/손실\n" +
        "• 충격 깊이: 시나리오로 인한 가격 하락 폭\n" +
        "• 회복 시간: 충격에서 회복되기까지 걸린 시간",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="sim-history"]',
    popover: {
      title: "실행 기록",
      description: "과거 시뮬레이션 결과를 비교할 수 있어요. 클릭하면 해당 결과가 다시 표시됩니다.",
      side: "left",
      align: "start",
    },
  },
]
