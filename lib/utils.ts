import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Structured logging utility
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
}

export const Logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', message, context }));
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', message, context }));
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', message, context }));
  },
};
