import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { API_CONFIG } from './api-config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }

  // 1. Use specific file URL env var if set (Preferred)
  if (process.env.NEXT_PUBLIC_FILE_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_FILE_URL.replace(/\/$/, "");
    const cleanPath = path.replace(/^\/+/, "");
    return `${baseUrl}/${cleanPath}`;
  }

  // 2. Fallback: derive from API_URL (legacy behavior)
  let baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, "");

  // If the base URL ends with /api, remove it to serve static files from root
  if (baseUrl.endsWith("/api")) {
    baseUrl = baseUrl.slice(0, -4);
  }

  const cleanPath = path.replace(/^\//, "");

  return `${baseUrl}/${cleanPath}`;
}

