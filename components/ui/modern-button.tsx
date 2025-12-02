"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type MotionButtonProps = HTMLMotionProps<"button">;

interface ModernButtonProps extends Omit<MotionButtonProps, "ref"> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const variantClasses = {
      primary: "bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-md border border-white/10 text-white shadow-lg hover:shadow-xl hover:from-white/[0.12] hover:to-white/[0.06] hover:border-white/15",
      secondary: "bg-gradient-to-b from-white/[0.06] to-white/[0.03] backdrop-blur-md border border-white/08 text-white hover:from-white/[0.10] hover:to-white/[0.05] hover:border-white/12",
      ghost: "bg-transparent backdrop-blur-sm text-white/80 hover:bg-white/[0.04] hover:text-white border border-transparent hover:border-white/08",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative rounded-lg font-medium transition-all duration-200 overflow-hidden",
          "transform-gpu",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        
        {/* Subtle top highlight for depth */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.button>
    );
  }
);

ModernButton.displayName = "ModernButton";