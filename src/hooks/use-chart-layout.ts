import { useCallback, useEffect, useRef, useState } from "react"

const OB_WIDTH = 280
const TH_WIDTH = 240
const GAP = 16
const PANELS_TOTAL = OB_WIDTH + TH_WIDTH + GAP // 536

const MIN_HEIGHT = 300
const MAX_HEIGHT = 900

type DragMode = "horizontal" | "corner"

export function useChartLayout(defaultHeight: number = 460) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [userWidth, setUserWidth] = useState<number | null>(null)
  const [userHeight, setUserHeight] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [panelsFading, setPanelsFading] = useState(false)
  const prevPanelsBelowRef = useRef(false)
  const rafRef = useRef(0)

  // 컨테이너 폭 추적
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 기본 차트 폭 (사용자 조정 전)
  const autoChartWidth = containerWidth - PANELS_TOTAL - GAP

  // 차트 실제 폭 — panelsBelow 모드에서도 userWidth를 반영
  const chartWidthPx = userWidth != null
    ? Math.max(autoChartWidth * 0.7, Math.min(containerWidth, userWidth))
    : autoChartWidth

  // 차트 실제 높이
  const chartHeightPx = userHeight ?? defaultHeight

  // 패널 하단 이동 여부
  const panelsBelow = chartWidthPx > autoChartWidth

  // 확대 시 패널 반분 폭
  const panelHalf = Math.floor((containerWidth - GAP) / 2)

  // panelsBelow 변경 시 crossfade
  useEffect(() => {
    if (panelsBelow !== prevPanelsBelowRef.current) {
      prevPanelsBelowRef.current = panelsBelow
      setPanelsFading(true)
      const timer = setTimeout(() => setPanelsFading(false), 250)
      return () => clearTimeout(timer)
    }
  }, [panelsBelow])

  // 드래그 핸들러 (이동 임계값 3px 이후에만 드래그 시작 — 더블클릭과 충돌 방지)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const startWidthRef = useRef(0)
  const startHeightRef = useRef(0)
  const dragActivatedRef = useRef(false)
  const dragModeRef = useRef<DragMode>("horizontal")

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: DragMode = "horizontal") => {
      e.preventDefault()

      startXRef.current = e.clientX
      startYRef.current = e.clientY
      startWidthRef.current = userWidth ?? autoChartWidth
      startHeightRef.current = userHeight ?? defaultHeight
      dragActivatedRef.current = false
      dragModeRef.current = mode

      const minW = autoChartWidth * 0.7
      const maxW = containerWidth

      const onMove = (me: PointerEvent) => {
        const deltaX = me.clientX - startXRef.current
        const deltaY = me.clientY - startYRef.current

        if (!dragActivatedRef.current) {
          if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) return
          dragActivatedRef.current = true
          setIsDragging(true)
          document.body.classList.add(
            mode === "corner" ? "resizing-chart-corner" : "resizing-chart",
          )
        }

        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          // 가로 조절
          const newW = Math.round(
            Math.max(minW, Math.min(maxW, startWidthRef.current + deltaX)),
          )
          setUserWidth(newW)

          // 세로 조절 (corner 모드에서만)
          if (mode === "corner") {
            const newH = Math.round(
              Math.max(
                MIN_HEIGHT,
                Math.min(MAX_HEIGHT, startHeightRef.current + deltaY),
              ),
            )
            setUserHeight(newH)
          }
        })
      }

      const onUp = () => {
        cancelAnimationFrame(rafRef.current)
        if (dragActivatedRef.current) {
          setIsDragging(false)
          document.body.classList.remove("resizing-chart", "resizing-chart-corner")
        }
        document.removeEventListener("pointermove", onMove)
        document.removeEventListener("pointerup", onUp)
      }

      document.addEventListener("pointermove", onMove)
      document.addEventListener("pointerup", onUp)
    },
    [userWidth, userHeight, autoChartWidth, containerWidth, defaultHeight],
  )

  const handleDoubleClick = useCallback(() => {
    setUserWidth((prev) => (prev !== null ? null : containerWidth))
    setUserHeight(null)
  }, [containerWidth])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 50 : 10
      const minW = autoChartWidth * 0.7
      if (e.key === "ArrowRight") {
        e.preventDefault()
        setUserWidth((prev) =>
          Math.min(containerWidth, (prev ?? autoChartWidth) + step),
        )
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        setUserWidth((prev) => Math.max(minW, (prev ?? autoChartWidth) - step))
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setUserHeight((prev) =>
          Math.min(MAX_HEIGHT, (prev ?? defaultHeight) + step),
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setUserHeight((prev) =>
          Math.max(MIN_HEIGHT, (prev ?? defaultHeight) - step),
        )
      }
    },
    [autoChartWidth, containerWidth, defaultHeight],
  )

  const resetLayout = useCallback(() => {
    setUserWidth(null)
    setUserHeight(null)
  }, [])

  return {
    containerRef,
    chartWidthPx,
    chartHeightPx,
    panelHalf,
    panelsBelow,
    isDragging,
    panelsFading,
    gripProps: {
      onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, "horizontal"),
      onDoubleClick: handleDoubleClick,
      onKeyDown: handleKeyDown,
    },
    cornerGripProps: {
      onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, "corner"),
      onDoubleClick: handleDoubleClick,
    },
    resetLayout,
  }
}
