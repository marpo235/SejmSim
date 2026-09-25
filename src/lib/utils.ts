import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtPct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits)}%`;
}

export function fmtInt(x: number): string {
  return x.toLocaleString("en-US");
}

export function fmtSigned(x: number): string {
  return x > 0 ? `+${x}` : `${x}`;
}
