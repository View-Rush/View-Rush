import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// clsx: This library conditionally joins class names together.
// twMerge: This library intelligently merges Tailwind CSS class names, ensuring that conflicting classes are resolved correctly.

// The cn function is a utility that combines the functionalities of clsx and twMerge to provide a robust way to handle class names in a React application using Tailwind CSS.