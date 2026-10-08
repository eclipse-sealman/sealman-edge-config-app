import React, { ButtonHTMLAttributes, DetailedHTMLProps } from "react";
import Spinner from "../Misc/Spinner";
import { cn } from "@/lib/utils";

interface HeadingProps {
  children: React.ReactNode
  description?: React.ReactNode
  /** Right-aligned controls, typically one or more HeadingButtons */
  actions?: React.ReactNode
  className?: string
  processing?: boolean
}

export function Heading({children, description, actions, processing, className}: HeadingProps) {
  return (
    <div className={cn("mb-3", className)}>
      <div className="flex w-full items-center gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">{children}</h3>
        <Spinner className="w-4 h-4 text-muted-foreground" processing={processing} />
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function HeadingButton({children, className, ...props}: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}