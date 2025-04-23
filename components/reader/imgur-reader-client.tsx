"use client";

import { useState, useEffect, useCallback } from "react";
import { /* Removed useRouter */ } from "next/navigation"; 
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Home, Square, Columns, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
// No DropdownMenu needed for Imgur albums
// Removed unused ScrollArea import
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { PageProgressBar } from "@/components/reader/page-progress-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

// Props for the Imgur client component
interface ImgurReaderClientProps {
  albumId: string;
  initialPages: string[];
}

type ViewMode = 'single' | 'double';

export function ImgurReaderClient({ 
  albumId, 
  initialPages
}: ImgurReaderClientProps) {
  
  // const router = useRouter(); // Removed unused variable

  // State managed on the client
  const [pages] = useState<string[]>(initialPages); // Pages are fixed for the album
  const [currentPage, setCurrentPage] = useState(1); // Start at 1, useEffect will check localStorage
  const [viewMode, setViewMode] = useState<ViewMode>('single'); // View mode state

  const totalPages = pages.length;
  const albumTitle = `Imgur Album: ${albumId}`; // Simple title

  // Effect to check localStorage for saved progress on mount
  useEffect(() => {
    // Different progress key for Imgur
    const progressKey = `manga-progress-imgur-${albumId}`; 
    const savedProgress = localStorage.getItem(progressKey);
    let pageToSet = 1;
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        pageToSet = Math.max(1, Math.min(progress.page || 1, pages.length || 1));
      } catch (e) {
        console.error("Failed to parse saved progress:", e);
        localStorage.removeItem(progressKey); // Remove invalid data
      }
    }
    setCurrentPage(pageToSet);
    window.scrollTo(0, 0); 
  }, [albumId, pages.length]); // Depend on albumId and pages length

  // Effect to save progress to localStorage when page changes
  useEffect(() => {
    if (albumId && pages.length > 0 && currentPage > 0) { 
        const progressKey = `manga-progress-imgur-${albumId}`;
        const progress = {
          page: currentPage,
          totalPages: pages.length,
          lastRead: new Date().toISOString(),
          // Could save viewMode here too if desired
        };
        localStorage.setItem(progressKey, JSON.stringify(progress));
    }
  }, [albumId, currentPage, pages.length]);

  // --- Navigation & Interaction ---

  const toggleViewMode = () => {
    setViewMode(current => (current === 'single' ? 'double' : 'single'));
  };

  // Wrap getPageIncrement in useCallback
  const getPageIncrement = useCallback(() => (viewMode === 'double' ? 2 : 1), [viewMode]);

  const goToNextPage = useCallback(() => {
    const increment = getPageIncrement();
    setCurrentPage(current => Math.min(current + increment, totalPages));
    window.scrollTo(0, 0); 
  }, [getPageIncrement, totalPages]);

  const goToPrevPage = useCallback(() => {
    const increment = getPageIncrement();
    setCurrentPage(current => Math.max(1, current - increment));
    window.scrollTo(0, 0);
  }, [getPageIncrement]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return; 
      if (e.key === "ArrowRight") goToNextPage();
      if (e.key === "ArrowLeft") goToPrevPage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPrevPage]); 

  // --- Page Number Display Logic ---
  const getPageDisplay = (): string => {
    if (totalPages === 0) return "0 / 0";
    if (viewMode === 'single' || currentPage >= totalPages) {
      return `${currentPage} / ${totalPages}`;
    }
    return `${currentPage}-${currentPage + 1} / ${totalPages}`;
  };

  // --- Render Reader --- 
  return (
    <Sheet>
      <div className="flex flex-col min-h-screen bg-black text-white">
        {/* Header - Adapted for Imgur */}
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm border-b border-gray-800">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-2">
            {/* Left Buttons (Home, Settings) */} 
            <div className="flex items-center gap-1"> 
               <Link href="/">
                 <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" aria-label="Go Home">
                   <Home className="h-5 w-5" />
                 </Button>
               </Link>
               {/* No Info or Chapter List for Imgur */}
               <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" aria-label="Open Settings">
                    <Settings className="h-5 w-5" />
                  </Button>
               </SheetTrigger>
            </div>
            {/* Center Info */} 
            <div className="flex-1 text-center text-sm text-gray-400 truncate px-2">
               <div className="font-semibold text-gray-200 truncate">{albumTitle}</div>
               <div className="truncate">Page {getPageDisplay()}</div> {/* Simplified text */} 
            </div>
            {/* Right Buttons Placeholder */} 
            <div className="flex items-center gap-2 w-16"> </div>
          </div>
        </header>

        {/* Image Display Area - Same logic as Gist */} 
        <main className="flex-1 flex flex-col items-center justify-center py-4 relative">
          <div className={cn(
            "flex items-center justify-center w-full h-full",
            viewMode === 'single' ? "max-w-3xl" : "max-w-6xl" 
          )}>
            {/* Single Page View */}
            {viewMode === 'single' && pages.length > 0 && currentPage >= 1 && currentPage <= pages.length && (
                <Image
                  key={`${albumId}-${pages[currentPage - 1]}-single`}
                  src={pages[currentPage - 1]}
                  alt={`Page ${currentPage} of Imgur album ${albumId}`}
                  width={900} height={1400} priority={currentPage === 1}
                  className="max-h-[calc(100vh-120px)] w-auto object-contain select-none"
                  unoptimized // Essential for external Imgur URLs
                />
            )}
            {/* Double Page View */}
            {viewMode === 'double' && pages.length > 0 && currentPage >= 1 && currentPage <= totalPages && (
              <div className="flex justify-center items-start gap-2 w-full">
                {/* Left Page */} 
                <div className="w-1/2 flex justify-end">
                  <Image
                    key={`${albumId}-${pages[currentPage - 1]}-double-left`}
                    src={pages[currentPage - 1]}
                    alt={`Page ${currentPage} of Imgur album ${albumId}`}
                    width={700} height={1100} priority={currentPage === 1}
                    className="max-h-[calc(100vh-120px)] w-auto object-contain select-none"
                    unoptimized 
                  />
                </div>
                {/* Right Page (Conditional) */} 
                <div className="w-1/2 flex justify-start">
                  {(currentPage + 1 <= totalPages) && (
                    <Image
                      key={`${albumId}-${pages[currentPage]}-double-right`}
                      src={pages[currentPage]} 
                      alt={`Page ${currentPage + 1} of Imgur album ${albumId}`}
                      width={700} height={1100} priority={currentPage === 1}
                      className="max-h-[calc(100vh-120px)] w-auto object-contain select-none"
                      unoptimized 
                    />
                  )}
                   {(currentPage + 1 > totalPages) && (<div className="w-[700px] h-[1100px] max-h-[calc(100vh-120px)]"></div>)}
                </div>
              </div>
            )}
            {(pages.length === 0 || currentPage < 1 || currentPage > totalPages) && (<div className="text-gray-500">Loading page...</div>)}
          </div>
        </main>

        {/* Clickable Overlay Navigation Areas - Stop above footer */}
        <div className="fixed inset-x-0 top-0 bottom-20 z-20 flex justify-between pointer-events-none">
          <button
            className="w-1/2 h-full pointer-events-auto cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:pointer-events-none group"
            onClick={goToPrevPage} disabled={currentPage <= 1} aria-label="Previous Page"
          ></button>
          <button
            className="w-1/2 h-full pointer-events-auto cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:pointer-events-none group"
            onClick={goToNextPage} disabled={currentPage >= totalPages} aria-label="Next Page"
          ></button>
        </div>

        {/* Footer Navigation */} 
        <footer className="sticky bottom-0 bg-black/80 backdrop-blur-sm border-t border-gray-800 py-3 z-10">
          <div className="container mx-auto px-4 flex flex-col items-center gap-3">
            {totalPages > 1 && (<PageProgressBar currentPage={currentPage} totalPages={totalPages} className="w-full max-w-md"/>)}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage <= 1} className="border-gray-700 text-gray-300">
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="px-4 text-sm text-gray-400 min-w-[80px] text-center">{getPageDisplay()}</div>
              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage >= totalPages} className="border-gray-700 text-gray-300">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </footer>
      </div>

      {/* Settings Sheet Content */}
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader><SheetTitle>Reader Settings</SheetTitle></SheetHeader>
        <div className="grid gap-6 py-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Page View</span>
            <Button variant="outline" size="sm" onClick={toggleViewMode} className="w-[100px]">
              {viewMode === 'single' ? <><Columns className="h-4 w-4 mr-2" /> Double</> : <><Square className="h-4 w-4 mr-2" /> Single</>}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 