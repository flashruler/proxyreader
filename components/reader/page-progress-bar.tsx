"use client";

import React from 'react';
import { cn } from "@/lib/utils"; // Assuming you have a utility for class names

interface PageProgressBarProps {
  currentPage: number;
  totalPages: number;
  className?: string;
}

/**
 * Displays a visual progress bar with segments representing pages.
 */
export function PageProgressBar({ 
  currentPage, 
  totalPages, 
  className 
}: PageProgressBarProps) {
  
  // Avoid rendering if invalid state
  if (totalPages <= 0 || currentPage <= 0) {
    return null; 
  }

  return (
    <div className={cn("flex items-center space-x-1 h-2", className)}>
      {Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;
        const isRead = pageNumber <= currentPage;

        return (
          <div
            key={pageNumber}
            className={cn(
              "h-full flex-1 rounded-sm transition-colors duration-200",
              isRead ? "bg-gray-200" : "bg-gray-600", // Read vs Unread color
              pageNumber === currentPage && "bg-white" // Highlight current page distinctly
            )}
            title={`Page ${pageNumber}`} // Tooltip for accessibility
          />
        );
      })}
    </div>
  );
} 