import React, { ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: 'default' | 'purple' | 'amber' | 'blue' | 'gradient';
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      variant = 'default',
      className,
      children,
      ...props
    },
    ref,
  ) => {

    const getVariantClasses = () => {
      switch (variant) {
        case 'purple':
          return "bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-500/30 hover:from-purple-600/30 hover:to-indigo-600/30 hover:shadow-lg hover:shadow-purple-500/25";
        case 'amber':
          return "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30 hover:from-amber-500/30 hover:to-yellow-500/30 hover:shadow-lg hover:shadow-amber-500/25";
        case 'blue':
          return "bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30 hover:from-blue-600/30 hover:to-cyan-600/30 hover:shadow-lg hover:shadow-blue-500/25";
        case 'gradient':
          return "bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 border-purple-500/30 hover:from-purple-600/30 hover:via-pink-600/30 hover:to-blue-600/30 hover:shadow-lg hover:shadow-purple-500/25";
        default:
          return "bg-white/5 border-white/10 hover:bg-white/10 hover:shadow-lg hover:shadow-white/10";
      }
    };

    return (
      <button
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center px-6 py-3 text-white font-medium",
          "rounded-full border backdrop-blur-sm",
          "transition-all duration-300 ease-out",
          "transform hover:scale-[1.02] active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          // Variant styles
          getVariantClasses(),
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* Content */}
        <span className="relative z-10 flex items-center">
          {children}
        </span>

        {/* Subtle shimmer effect on hover */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        </div>
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";