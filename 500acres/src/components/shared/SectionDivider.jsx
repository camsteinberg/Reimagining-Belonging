/**
 * Shared divider component with 4 variants:
 * - "line"      — h-px line inside page-container (default)
 * - "dot"       — centered dot
 * - "space"     — empty vertical spacer
 * - "editorial" — line with centered dot
 */
export default function SectionDivider({ variant = "line" }) {
  if (variant === "space") {
    return <div className="h-16 md:h-24" />;
  }

  if (variant === "dot") {
    return (
      <div className="page-container flex justify-center py-8 md:py-12">
        <div className="w-1.5 h-1.5 rounded-full bg-charcoal/20" />
      </div>
    );
  }

  if (variant === "editorial") {
    return (
      <div className="page-container flex items-center gap-4 py-8 md:py-12">
        <div className="flex-1 h-px bg-charcoal/10" />
        <div className="w-1.5 h-1.5 rounded-full bg-charcoal/20" />
        <div className="flex-1 h-px bg-charcoal/10" />
      </div>
    );
  }

  // Default: "line"
  return (
    <div className="page-container">
      <div className="h-px bg-charcoal/10" />
    </div>
  );
}
