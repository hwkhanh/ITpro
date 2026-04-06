"use client";

import * as React from "react"

// We use basic tailwind classes since we don't have CVA installed, actually let's just make it simple React components without dependencies.

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'bordeaux' | 'gold';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-50 active:scale-95";
    
    const variants = {
      default: "bg-gradient-to-r from-gold-warm to-gold text-navy shadow-glow-gold hover:shadow-glow-gold-lg hover:brightness-110",
      bordeaux: "bg-bordeaux text-white hover:bg-bordeaux-light shadow-sm",
      gold: "bg-gradient-to-r from-gold-warm to-gold text-navy shadow-glow-gold hover:shadow-glow-gold-lg hover:brightness-110",
      outline: "border border-indigo-muted bg-transparent shadow-sm hover:bg-navy-light hover:border-gold/30 text-foreground",
      ghost: "hover:bg-navy-light text-foreground",
    };
    
    const sizes = {
      default: "h-11 px-6 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-md px-8 text-md",
      icon: "h-9 w-9",
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button
        className={combinedClassName}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
