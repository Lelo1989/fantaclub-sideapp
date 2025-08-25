// src/components/Skeleton.tsx
"use client";

type Props = {
  className?: string;
  "aria-label"?: string;
};

export default function Skeleton({ className = "", ...rest }: Props) {
  return (
    <div
      role="status"
      aria-busy="true"
      {...rest}
      className={`animate-pulse rounded bg-white/10 ${className}`}
    />
  );
}
