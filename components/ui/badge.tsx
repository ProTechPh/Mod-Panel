import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 font-mono text-[0.65rem] font-semibold tracking-[0.06em] uppercase whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // Tinted plate rather than a solid fill — reads as a label, not a CTA.
        default:
          "border-[rgba(234,88,12,0.28)] bg-[rgba(234,88,12,0.12)] text-[var(--brand-300)]",
        secondary:
          "border-[var(--border-hi)] bg-white/[0.04] text-muted-foreground",
        destructive:
          "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)] text-[var(--red-soft)]",
        outline:
          "border-[var(--border-hi)] bg-transparent text-foreground",
        success:
          "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.12)] text-[var(--green-soft)]",
        warning:
          "border-[rgba(234,179,8,0.28)] bg-[rgba(234,179,8,0.12)] text-[var(--gold-soft)]",
        ghost:
          "border-transparent text-muted-foreground hover:text-foreground",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
