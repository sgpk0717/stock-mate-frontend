import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-6 w-6 shrink-0 rounded border border-border cursor-pointer"
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start" sideOffset={8}>
        <HexColorPicker color={color} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}

export default ColorPicker
