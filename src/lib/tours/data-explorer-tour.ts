import type { DriveStep } from "driver.js"

export const dataExplorerTourSteps: DriveStep[] = [
  {
    element: '[data-tour="data-header"]',
    popover: {
      title: "검색 조건",
      description:
        "종목을 선택하고 날짜 범위를 지정하면 해당 조건으로 데이터를 조회해요. " +
        "종목을 선택하지 않으면 전체 데이터가 표시됩니다.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="data-overview"]',
    popover: {
      title: "수집 현황",
      description:
        "각 데이터 테이블의 수집 상태를 카드로 보여줘요. " +
        "총 건수, 수집 기간, 마지막 수집 시각을 확인할 수 있습니다.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="data-tabs"]',
    popover: {
      title: "데이터 탭",
      description:
        "7가지 데이터를 탭으로 탐색할 수 있어요.\n" +
        "투자자 수급, 공매도/신용, DART 재무, 프로그램 매매, " +
        "뉴스 감성, 캔들 커버리지, 데이터 갭을 확인하세요.",
      side: "top",
      align: "start",
    },
  },
]
