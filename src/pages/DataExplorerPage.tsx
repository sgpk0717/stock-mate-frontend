import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StockSearch from "@/components/stock/StockSearch"
import CollectionOverview from "@/components/data-explorer/CollectionOverview"
import InvestorTradingTab from "@/components/data-explorer/InvestorTradingTab"
import MarginShortTab from "@/components/data-explorer/MarginShortTab"
import DartFinancialsTab from "@/components/data-explorer/DartFinancialsTab"
import ProgramTradingTab from "@/components/data-explorer/ProgramTradingTab"
import NewsSentimentTab from "@/components/data-explorer/NewsSentimentTab"
import CandleCoverageTab from "@/components/data-explorer/CandleCoverageTab"
import DataGapsTab from "@/components/data-explorer/DataGapsTab"

function DataExplorerPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [pages, setPages] = useState<Record<string, number>>({})
  const [pageSize, setPageSize] = useState(50)

  const getPage = (tab: string) => pages[tab] ?? 0
  const setPage = (tab: string, p: number) => setPages((prev) => ({ ...prev, [tab]: p }))
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPages({})
  }
  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol)
    setPages({})
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div data-tour="data-header" className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">데이터 탐색</h1>
        <StockSearch onSelect={handleSymbolChange} value={selectedSymbol} />
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">시작</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPages({}) }}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
          />
          <label className="text-xs text-muted-foreground">종료</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPages({}) }}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
          />
        </div>
      </div>

      <div data-tour="data-overview">
        <CollectionOverview />
      </div>

      <Tabs data-tour="data-tabs" defaultValue="investor">
        <TabsList>
          <TabsTrigger value="investor">투자자 수급</TabsTrigger>
          <TabsTrigger value="margin">공매도/신용</TabsTrigger>
          <TabsTrigger value="dart">DART 재무</TabsTrigger>
          <TabsTrigger value="program">프로그램 매매</TabsTrigger>
          <TabsTrigger value="news">뉴스 감성</TabsTrigger>
          <TabsTrigger value="candle">캔들 커버리지</TabsTrigger>
          <TabsTrigger value="gaps">데이터 갭</TabsTrigger>
        </TabsList>

        <TabsContent value="investor">
          <InvestorTradingTab
            symbol={selectedSymbol} start={startDate || undefined} end={endDate || undefined}
            page={getPage("investor")} pageSize={pageSize}
            onPageChange={(p) => setPage("investor", p)} onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>
        <TabsContent value="margin">
          <MarginShortTab
            symbol={selectedSymbol} start={startDate || undefined} end={endDate || undefined}
            page={getPage("margin")} pageSize={pageSize}
            onPageChange={(p) => setPage("margin", p)} onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>
        <TabsContent value="dart">
          <DartFinancialsTab
            symbol={selectedSymbol}
            page={getPage("dart")} pageSize={pageSize}
            onPageChange={(p) => setPage("dart", p)} onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>
        <TabsContent value="program">
          <ProgramTradingTab
            symbol={selectedSymbol} start={startDate || undefined} end={endDate || undefined}
            page={getPage("program")} pageSize={pageSize}
            onPageChange={(p) => setPage("program", p)} onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>
        <TabsContent value="news">
          <NewsSentimentTab
            symbol={selectedSymbol}
            page={getPage("news")} pageSize={pageSize}
            onPageChange={(p) => setPage("news", p)} onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>
        <TabsContent value="candle">
          <CandleCoverageTab symbol={selectedSymbol} />
        </TabsContent>
        <TabsContent value="gaps">
          <DataGapsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DataExplorerPage
