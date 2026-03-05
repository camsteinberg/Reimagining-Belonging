'use client';

import React from "react";

interface SectionHeaderProps {
  label?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  headingSize?: "lg" | "xl";
  maxWidth?: string;
  reveal?: string;
  className?: string;
}

/**
 * SectionHeader -- Reusable section intro pattern.
 */
export default function SectionHeader({
  label,
  title,
  description,
  align = "left",
  headingSize = "xl",
  maxWidth = "max-w-2xl",
  reveal = "reveal-up",
  className = "",
}: SectionHeaderProps) {
  const isCenter = align === "center";
  const headingCls =
    headingSize === "lg"
      ? "font-serif text-3xl md:text-4xl font-bold text-charcoal leading-[1.15]"
      : "font-serif text-3xl md:text-5xl font-bold text-charcoal";

  return (
    <div
      className={`${isCenter ? "text-center" : ""} ${className}`}
    >
      {label && (
        <p
          className={`${reveal} font-sans text-xs uppercase tracking-[0.4em] text-charcoal/60 mb-4`}
        >
          {label}
        </p>
      )}
      <h2
        className={`${reveal} stagger-1 ${headingCls}${description ? " mb-4" : ""}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`${reveal} stagger-2 font-serif text-lg text-charcoal/70 ${maxWidth}${isCenter ? " mx-auto" : ""}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
