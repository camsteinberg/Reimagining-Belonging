'use client';

interface SectionDividerProps {
  variant?: "line" | "dot" | "space" | "editorial";
  className?: string;
}

/**
 * Shared divider component with 4 variants:
 * - "line"      -- h-px line inside page-container (default)
 * - "dot"       -- centered dot
 * - "space"     -- empty vertical spacer
 * - "editorial" -- line with centered dot
 */
export default function SectionDivider({ variant = "line", className = "" }: SectionDividerProps) {
  if (variant === "space") {
    return <div className={`h-16 md:h-24 ${className}`} />;
  }

  if (variant === "dot") {
    return (
      <div className={`page-container flex justify-center py-8 md:py-12 ${className}`}>
        <div className="reveal-scale w-1.5 h-1.5 rounded-full bg-charcoal/20" />
      </div>
    );
  }

  if (variant === "editorial") {
    return (
      <div className={`reveal-fade page-container flex items-center gap-4 py-8 md:py-12 ${className}`}>
        <div className="flex-1 h-px bg-charcoal/10" />
        <div className="w-1.5 h-1.5 rounded-full bg-charcoal/20" />
        <div className="flex-1 h-px bg-charcoal/10" />
      </div>
    );
  }

  // Default: "line"
  return (
    <div className={`reveal-fade page-container ${className}`}>
      <div className="h-px bg-charcoal/10" />
    </div>
  );
}
