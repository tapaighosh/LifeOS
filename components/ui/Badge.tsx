import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "money" | "soul" | "curiosity" | "recharge";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900": variant === "default",
          "border-transparent bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50": variant === "secondary",
          "text-zinc-950 dark:text-zinc-50": variant === "outline",
          "border-transparent bg-pillar-money/20 text-amber-600 dark:text-amber-400": variant === "money",
          "border-transparent bg-pillar-soul/20 text-rose-600 dark:text-rose-400": variant === "soul",
          "border-transparent bg-pillar-curiosity/20 text-indigo-600 dark:text-indigo-400": variant === "curiosity",
          "border-transparent bg-recharge/20 text-emerald-600 dark:text-emerald-400": variant === "recharge",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
