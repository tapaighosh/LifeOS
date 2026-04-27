"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
  onClose?: () => void;
  className?: string;
}

export function Toast({ title, description, variant = "default", onClose, className }: ToastProps) {
  return (
    <div className={cn(
      "pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all",
      {
        "bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800": variant === "default",
        "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-900 text-green-800 dark:text-green-300": variant === "success",
        "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-900 text-red-800 dark:text-red-300": variant === "error",
      },
      className
    )}>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-sm opacity-90">{description}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-1 top-1 rounded-md p-1 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// In a real app, this would be managed by a ToastProvider context.
