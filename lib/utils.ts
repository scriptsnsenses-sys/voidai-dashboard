import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe render function to prevent React object rendering errors
export function safeRender(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(item => safeRender(item)).join(', ');
    }
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
}

// Specifically for model objects that might have complex structures
export function safeRenderModel(modelData: any): string {
  if (!modelData) return '';
  
  if (typeof modelData === 'string') {
    return modelData;
  }
  
  if (typeof modelData === 'object') {
    // Handle model objects with potential nested structures
    if (modelData.id) {
      return modelData.id;
    }
    
    // Handle objects with model names as keys (like "5-pro-preview-05-06")
    if (typeof modelData === 'object' && !Array.isArray(modelData)) {
      const keys = Object.keys(modelData);
      if (keys.length > 0) {
        return keys.join(', ');
      }
    }
    
    return JSON.stringify(modelData, null, 2);
  }
  
  return String(modelData);
}