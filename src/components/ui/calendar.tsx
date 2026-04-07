import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center h-7 px-8",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 flex items-center justify-between px-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has([aria-selected])]:bg-accent [&:has([aria-selected].outside)]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md [&:has([aria-selected])]:bg-accent",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
        ),
        range_start:
          "rounded-l-md [&>.rdp-day_button]:bg-primary [&>.rdp-day_button]:text-primary-foreground",
        range_end:
          "rounded-r-md [&>.rdp-day_button]:bg-primary [&>.rdp-day_button]:text-primary-foreground",
        selected:
          "[&>.rdp-day_button]:bg-primary [&>.rdp-day_button]:text-primary-foreground [&>.rdp-day_button]:hover:bg-primary [&>.rdp-day_button]:hover:text-primary-foreground [&>.rdp-day_button]:focus:bg-primary [&>.rdp-day_button]:focus:text-primary-foreground",
        today: "[&>.rdp-day_button]:bg-accent [&>.rdp-day_button]:text-accent-foreground",
        outside:
          "outside text-muted-foreground aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "[&>.rdp-day_button]:bg-transparent [&>.rdp-day_button]:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
