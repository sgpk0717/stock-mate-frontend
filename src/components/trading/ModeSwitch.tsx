import { Term } from "@/components/ui/term"
import { cn } from "@/lib/utils"

interface ModeSwitchProps {
  mode: "paper" | "real"
  onModeChange: (mode: "paper" | "real") => void
  disabled?: boolean
}

function ModeSwitch({ mode, onModeChange, disabled }: ModeSwitchProps) {
  return (
    <div className="inline-flex rounded-lg border p-0.5">
      <button
        type="button"
        className={cn(
          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          mode === "paper"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => onModeChange("paper")}
        disabled={disabled}
      >
        <Term>모의투자</Term>
      </button>
      <button
        type="button"
        className={cn(
          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          mode === "real"
            ? "bg-destructive text-destructive-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => onModeChange("real")}
        disabled={disabled}
      >
        <Term>실거래</Term>
      </button>
    </div>
  )
}

export default ModeSwitch
