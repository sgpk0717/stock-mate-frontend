import { useCallback } from "react"
import { driver, type DriveStep } from "driver.js"

export function useTour(pageKey: string, steps: DriveStep[]) {
  const startTour = useCallback(() => {
    const d = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: "rgba(0,0,0,0.55)",
      nextBtnText: "다음",
      prevBtnText: "이전",
      doneBtnText: "완료",
      steps,
      onDestroyStarted: () => {
        localStorage.setItem(`tour_seen_${pageKey}`, "true")
        d.destroy()
      },
    })
    d.drive()
  }, [pageKey, steps])

  const hasSeen = localStorage.getItem(`tour_seen_${pageKey}`) === "true"

  const resetTour = useCallback(() => {
    localStorage.removeItem(`tour_seen_${pageKey}`)
  }, [pageKey])

  return { startTour, hasSeen, resetTour }
}
