"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

export const controlButtonBaseClassName =
  "inline-flex min-h-11 items-center justify-center rounded-pill px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export const controlButtonVariantClasses: Record<
  NonNullable<ControlButtonProps["variant"]>,
  string
> = {
  primary:
    "bg-gold text-ink hover:bg-gold-strong disabled:bg-gold-muted/40 disabled:text-ink/60",
  secondary:
    "border border-gold/45 bg-gold-surface/50 text-gold hover:bg-gold-surface/80 disabled:border-gold-muted/20 disabled:text-gold-muted/60",
  ghost:
    "border border-transparent bg-transparent text-gold hover:border-gold/35 hover:bg-gold-surface/30 disabled:text-gold-muted/60",
};

export const getControlButtonClassName = (
  variant: NonNullable<ControlButtonProps["variant"]>,
  className = "",
) =>
  `${controlButtonBaseClassName} ${controlButtonVariantClasses[variant]} ${className}`.trim();

export function ControlButton({
  children,
  className = "",
  variant = "secondary",
  ...props
}: ControlButtonProps) {
  return (
    <button
      className={getControlButtonClassName(variant, className)}
      {...props}
    >
      {children}
    </button>
  );
}
