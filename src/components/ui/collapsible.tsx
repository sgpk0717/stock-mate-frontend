import * as React from "react"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

function Collapsible({ open, onOpenChange, children, className }: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const toggle = onOpenChange ?? setInternalOpen

  return (
    <div className={className} data-state={isOpen ? "open" : "closed"}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<{ __collapsibleTrigger?: boolean; __collapsibleContent?: boolean }>(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child as React.ReactElement<CollapsibleTriggerInternalProps>, {
              __isOpen: isOpen,
              __onToggle: () => toggle(!isOpen),
            })
          }
          if (child.type === CollapsibleContent) {
            return React.cloneElement(child as React.ReactElement<CollapsibleContentInternalProps>, {
              __isOpen: isOpen,
            })
          }
        }
        return child
      })}
    </div>
  )
}

interface CollapsibleTriggerProps {
  children: React.ReactNode
  className?: string
}

interface CollapsibleTriggerInternalProps extends CollapsibleTriggerProps {
  __isOpen?: boolean
  __onToggle?: () => void
}

function CollapsibleTrigger({ children, className, __isOpen, __onToggle }: CollapsibleTriggerInternalProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={__onToggle}
      data-state={__isOpen ? "open" : "closed"}
    >
      {children}
    </button>
  )
}

interface CollapsibleContentProps {
  children: React.ReactNode
  className?: string
}

interface CollapsibleContentInternalProps extends CollapsibleContentProps {
  __isOpen?: boolean
}

function CollapsibleContent({ children, className, __isOpen }: CollapsibleContentInternalProps) {
  if (!__isOpen) return null
  return <div className={className}>{children}</div>
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
