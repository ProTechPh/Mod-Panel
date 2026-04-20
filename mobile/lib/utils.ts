import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(d: number | string): string {
  if (d === "1h") return "1 Hour";
  if (d === "6h") return "6 Hours";
  return `${d} Day${Number(d) > 1 ? "s" : ""}`;
}

export function levelName(level: number): string {
  if (level === 1) return "Owner";
  if (level === 2) return "Admin";
  return "Reseller";
}