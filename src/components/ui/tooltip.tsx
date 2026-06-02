import * as React from "react"
import { cn } from "@/lib/utils"

const TooltipContext = React.createContext<boolean>(false)

function TooltipProvider({
  children,
  delayDuration: _delayDuration,
  skipDelayDuration: _skipDelayDuration,
  disableHoverableContent: _disableHoverableContent,
}: {
  children: React.ReactNode
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
}) {
  return (
    <TooltipContext.Provider value={true}>
      {children}
    </TooltipContext.Provider>
  )
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return children
  }
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    sideOffset?: number
    side?: "top" | "right" | "bottom" | "left"
    align?: "start" | "center" | "end"
  }
>(({ className, sideOffset: _sideOffset = 4, side: _side, align: _align, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
