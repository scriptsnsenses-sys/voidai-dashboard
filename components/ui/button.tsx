import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md border border-white/10 text-white shadow-lg hover:shadow-xl hover:from-white/[0.12] hover:to-white/[0.06] hover:border-white/15",
        destructive:
          "bg-gradient-to-b from-red-500/20 to-red-600/20 backdrop-blur-md border border-red-500/30 text-white shadow-lg hover:shadow-xl hover:from-red-500/25 hover:to-red-600/25",
        outline:
          "bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-md border border-white/08 text-white hover:from-white/[0.06] hover:to-white/[0.03] hover:border-white/12",
        secondary:
          "bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 text-white hover:from-white/[0.10] hover:to-white/[0.05] hover:border-white/12",
        ghost: "bg-transparent backdrop-blur-sm text-white/80 hover:bg-white/[0.04] hover:text-white border border-transparent hover:border-white/08",
        link: "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }