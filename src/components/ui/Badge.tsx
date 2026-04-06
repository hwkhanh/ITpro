"use client";

import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'safe' | 'risk' | 'outline' | 'gold';
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-background";
  
  const variants = {
    default: "border-indigo-muted bg-navy-light text-foreground",
    safe: "border-green-500/50 bg-navy text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]",
    risk: "border-bordeaux bg-bordeaux/20 text-red-200 shadow-[0_0_10px_rgba(160,62,62,0.3)]",
    outline: "border-indigo-muted text-foreground",
    gold: "border-gold/50 bg-gold/10 text-gold shadow-glow-gold",
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <div className={combinedClassName} {...props} />
  )
}

export { Badge }
