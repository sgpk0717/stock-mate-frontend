import type { DriveStep } from "driver.js"

export const alphaTourSteps: DriveStep[] = [
  {
    element: '[data-tour="alpha-tabs"]',
    popover: {
      title: "알파 탐색 모드",
      description:
        "알파 탐색은 3가지 모드가 있어요.\n" +
        "• 탐색: AI가 수익을 만드는 알파 팩터를 찾습니다\n" +
        "• 공장: 자동으로 주기적 탐색을 돌립니다\n" +
        "• 포트폴리오: 여러 팩터를 조합해요",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="alpha-mine-config"]',
    popover: {
      title: "탐색 설정",
      description:
        "어떤 종목군(유니버스)에서, 어떤 기간의 데이터로 팩터를 찾을지 설정해요. " +
        "유니버스는 KOSPI200, KOSDAQ150 등을 선택할 수 있어요.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="alpha-mine-start"]',
    popover: {
      title: "탐색 시작",
      description:
        "설정이 끝나면 이 버튼을 눌러 AI가 알파 팩터 탐색을 시작합니다. " +
        "Claude AI가 가설을 세우고, 수학적으로 검증하는 과정을 거쳐요.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="alpha-factor-table"]',
    popover: {
      title: "발견된 팩터 목록",
      description:
        "발견된 팩터가 여기 나타나요.\n" +
        "• IC: 예측력 (높을수록 좋음)\n" +
        "• Sharpe: 위험 대비 수익률\n" +
        "• 인과 검증: 진짜 원인인지 통계적 확인",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="alpha-factory-tab"]',
    popover: {
      title: "공장 탭",
      description:
        "공장 탭에서는 AI가 설정한 간격으로 자동 탐색합니다. " +
        "한 번 켜놓으면 알아서 새로운 팩터를 발굴해요.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="alpha-portfolio-tab"]',
    popover: {
      title: "포트폴리오 탭",
      description:
        "여러 팩터를 하나로 합쳐 더 안정적인 전략을 만들 수 있어요. " +
        "팩터 간 상관관계를 분석해서 분산 효과를 극대화합니다.",
      side: "bottom",
      align: "center",
    },
  },
]
