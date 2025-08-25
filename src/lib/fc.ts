// src/lib/fc.ts
export function renewalCost(currentEnd: number, newEnd: number, feePerYear: number) {
  const deltaYears = Math.max(0, newEnd - currentEnd);
  return deltaYears * feePerYear;
}
