"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// The console is dark-only (see app/layout.tsx), so the theme is pinned rather
// than read from next-themes — that provider is not mounted and the hook was
// returning undefined.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      closeButton
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--bg-card-2)",
          "--normal-text": "var(--text-hi)",
          "--normal-border": "var(--border-hi)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--bg-card-2)",
          "--success-text": "var(--green-soft)",
          "--success-border": "rgba(34, 197, 94, 0.3)",
          "--error-bg": "var(--bg-card-2)",
          "--error-text": "var(--red-soft)",
          "--error-border": "rgba(239, 68, 68, 0.3)",
          "--warning-bg": "var(--bg-card-2)",
          "--warning-text": "var(--gold-soft)",
          "--warning-border": "rgba(234, 179, 8, 0.3)",
          "--info-bg": "var(--bg-card-2)",
          "--info-text": "var(--brand-300)",
          "--info-border": "rgba(249, 115, 22, 0.3)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
