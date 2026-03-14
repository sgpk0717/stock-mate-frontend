import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "@/components/layout/AppLayout"
import Dashboard from "@/pages/Dashboard"
import ChartPage from "@/pages/ChartPage"
import OrderPage from "@/pages/OrderPage"
import PositionPage from "@/pages/PositionPage"
import HistoryPage from "@/pages/HistoryPage"
import BacktestPage from "@/pages/BacktestPage"
import TradingPage from "@/pages/TradingPage"
import AlphaLabPage from "@/pages/AlphaLabPage"
import SimulationPage from "@/pages/SimulationPage"
import WorkflowPage from "@/pages/WorkflowPage"
import DataExplorerPage from "@/pages/DataExplorerPage"
import SettingsPage from "@/pages/SettingsPage"

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/positions" element={<PositionPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/backtest" element={<BacktestPage />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/alpha" element={<AlphaLabPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/workflow" element={<WorkflowPage />} />
          <Route path="/data" element={<DataExplorerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
