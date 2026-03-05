'use client';

import Image from "next/image";
import logoPng from "../../../assets/brand/500acres.webp";

interface LogoProps {
  className?: string;
  showText?: boolean;
  style?: React.CSSProperties;
}

export default function Logo({ className = "", showText = true, style }: LogoProps) {
  return (
    <Image
      src={logoPng}
      alt="500 Acres"
      className={className}
      style={{
        ...(showText ? {} : { objectFit: "cover", objectPosition: "top center" }),
        ...style,
      }}
    />
  );
}
