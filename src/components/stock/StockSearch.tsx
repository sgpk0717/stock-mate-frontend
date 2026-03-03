import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useStockList } from "@/hooks/queries"
import { useAppStore } from "@/stores/use-app-store"
import { cn } from "@/lib/utils"
import type { StockInfo } from "@/types"

interface StockSearchProps {
  className?: string
  onSelect?: (symbol: string) => void
}

function StockSearch({ className, onSelect }: StockSearchProps) {
  const [open, setOpen] = useState(false)
  const selectedSymbol = useAppStore((s) => s.selectedSymbol)
  const setSelectedSymbol = useAppStore((s) => s.setSelectedSymbol)
  const { data: stocks = [] } = useStockList()

  const selected = stocks.find((s) => s.symbol === selectedSymbol)

  const kospi = stocks.filter((s) => s.market === "KOSPI")
  const kosdaq = stocks.filter((s) => s.market === "KOSDAQ")

  function handleSelect(symbol: string) {
    if (onSelect) {
      onSelect(symbol)
    } else {
      setSelectedSymbol(symbol)
    }
    setOpen(false)
  }

  function renderItem(stock: StockInfo) {
    return (
      <CommandItem
        key={stock.symbol}
        value={`${stock.name} ${stock.symbol}`}
        onSelect={() => handleSelect(stock.symbol)}
      >
        <span className="flex-1 truncate">{stock.name}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          {stock.symbol}
        </span>
      </CommandItem>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-64 justify-between font-normal", className)}
        >
          {selected
            ? `${selected.name} (${selected.symbol})`
            : "종목 검색..."}
          <svg
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="종목명 또는 코드 검색..." />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            {kospi.length > 0 && (
              <CommandGroup heading="KOSPI">
                {kospi.map(renderItem)}
              </CommandGroup>
            )}
            {kosdaq.length > 0 && (
              <CommandGroup heading="KOSDAQ">
                {kosdaq.map(renderItem)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default StockSearch
