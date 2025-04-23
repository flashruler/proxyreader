"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation"; 
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Home, List, Info, Square, Columns, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { PageProgressBar } from "@/components/reader/page-progress-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import type { GistConfig } from "@/lib/gist"; // Using 'type' for import
import { cn } from "@/lib/utils";

// Helper function to sort chapter keys numerically/naturally
// (Similar to the one in GistInfoPage)
function sortChapterKeys(keys: string[]): string[] {
  return keys.sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB; // Sort numerically if both are numbers
    }
    // Fallback to string comparison if not numerical
    return a.localeCompare(b);
  });
}

// Interface for the props the client component will receive
interface GistReaderClientProps {
  gistId: string;
  initialChapterKey: string;
  initialPages: string[];
  initialConfig: GistConfig;
  // We might not need initialCurrentPage if we always check localStorage first
}

type ViewMode = 'single' | 'double';

export function GistReaderClient({ 
  gistId, 
  initialChapterKey, 
  initialPages,
  initialConfig 
}: GistReaderClientProps) {
  
  const router = useRouter(); 

  // State managed on the client
  const [chapterKey] = useState(initialChapterKey);
  const [pages] = useState<string[]>(initialPages);
  const [currentPage, setCurrentPage] = useState(1); // Start at 1, useEffect will check localStorage
  const [config] = useState<GistConfig>(initialConfig); // Config is unlikely to change client-side for now
  const [viewMode, setViewMode] = useState<ViewMode>('single'); // View mode state

  // Memoize the sorted chapter keys and details
  const sortedChapters = useMemo(() => {
    if (!config?.chapters) return [];
    const keys = sortChapterKeys(Object.keys(config.chapters));
    return keys.map(key => ({
      key,
      title: config.chapters[key].title || `Chapter ${key}`
    }));
  }, [config]);

  const totalPages = pages.length;
  const chapterTitle = config?.chapters[chapterKey]?.title ?? `Chapter ${chapterKey}`;
  const mangaTitle = config?.title ?? 'Gist Reader';

  // Effect to check localStorage for saved progress on mount/chapter change
  useEffect(() => {
    const progressKey = `manga-progress-gist-${gistId}-${chapterKey}`;
    const savedProgress = localStorage.getItem(progressKey);
    let pageToSet = 1;
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        // Validate page number from localStorage
        pageToSet = Math.max(1, Math.min(progress.page || 1, pages.length || 1));
      } catch (e) {
        console.error("Failed to parse saved progress:", e);
        localStorage.removeItem(progressKey); // Remove invalid data
      }
    }
    setCurrentPage(pageToSet);
    window.scrollTo(0, 0); // Scroll to top when chapter/page loads initially
  }, [gistId, chapterKey, pages.length]); // Rerun if gist/chapter/pages change

  // Effect to save progress to localStorage when page changes
  useEffect(() => {
    // Only save if we have pages and are not on the initial load state (prevents saving '1' before checking localStorage)
    if (gistId && chapterKey && pages.length > 0 && currentPage > 0) { 
        const progressKey = `manga-progress-gist-${gistId}-${chapterKey}`;
        const progress = {
          page: currentPage,
          totalPages: pages.length,
          lastRead: new Date().toISOString(),
        };
        localStorage.setItem(progressKey, JSON.stringify(progress));
    }
  }, [gistId, chapterKey, currentPage, pages.length]);

  // --- Navigation & Interaction ---

  const toggleViewMode = () => {
    setViewMode(current => (current === 'single' ? 'double' : 'single'));
    // Reset page slightly when switching modes to avoid awkward page pairs?
    // Maybe ensure currentPage is odd when switching to double?
    // For now, keep it simple.
  };

  // Wrap getPageIncrement in useCallback
  const getPageIncrement = useCallback(() => (viewMode === 'double' ? 2 : 1), [viewMode]);

  // Wrap navigation functions in useCallback
  const goToNextPage = useCallback(() => {
    const increment = getPageIncrement();
    setCurrentPage(current => Math.min(current + increment, totalPages));
    window.scrollTo(0, 0); 
  }, [getPageIncrement, totalPages]); // Added getPageIncrement dep

  const goToPrevPage = useCallback(() => {
    const increment = getPageIncrement();
    setCurrentPage(current => Math.max(1, current - increment));
    window.scrollTo(0, 0);
  }, [getPageIncrement]); // Added getPageIncrement dep
  
  // Keyboard navigation - Ensure dependencies are correct
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return; 
      if (e.key === "ArrowRight") goToNextPage();
      if (e.key === "ArrowLeft") goToPrevPage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPrevPage]); // Dependencies should be correct now

  // --- Page Number Display Logic ---
  const getPageDisplay = (): string => {
    if (totalPages === 0) return "0 / 0";
    if (viewMode === 'single' || currentPage >= totalPages) {
      return `${currentPage} / ${totalPages}`;
    }
    // Double page view, not on the last page
    return `${currentPage}-${currentPage + 1} / ${totalPages}`;
  };

  // --- Render Reader --- 
  // (Assuming loading/error states are handled by the Server Component parent)
  return (
    <Sheet>
      <div className="flex flex-col min-h-screen bg-black text-white">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm border-b border-gray-800">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-2">
            {/* Left Buttons (Home, Info, Chapters, Settings) */} 
            <div className="flex items-center gap-1"> {/* Reduced gap slightly */} 
               {/* Home Button */} 
               <Link href="/">
                 <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" aria-label="Go Home">
                   <Home className="h-5 w-5" />
                 </Button>
               </Link>
               {/* Info Button */} 
               <Link href={`/info/gist/${gistId}`} passHref>
                 <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" aria-label="Back to Info">
                   <Info className="h-5 w-5" />
                 </Button>
               </Link>
               {/* Chapter List Dropdown */}
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="text-gray-400 hover:text-white" 
                     aria-label="Select Chapter"
                     disabled={sortedChapters.length === 0} // Disable if no chapters
                   >
                     <List className="h-5 w-5" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="start" className="max-h-[70vh]">
                   <DropdownMenuLabel>Chapters</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   <ScrollArea className="h-full">
                     {sortedChapters.length > 0 ? (
                       sortedChapters.map((chapter) => (
                         <DropdownMenuItem 
                           key={chapter.key}
                           onSelect={() => router.push(`/read/gist/${gistId}/${chapter.key}`)}
                           disabled={chapter.key === chapterKey} // Disable current chapter
                           className="cursor-pointer"
                         >
                           <span className="w-12 font-mono text-xs mr-2 text-right flex-shrink-0">{chapter.key}</span>
                           <span className="truncate">{chapter.title}</span>
                         </DropdownMenuItem>
                       ))
                     ) : (
                       <DropdownMenuItem disabled>No chapters found</DropdownMenuItem>
                     )}
                   </ScrollArea>
                 </DropdownMenuContent>
               </DropdownMenu>
               {/* Settings Sheet Trigger (Moved Here) */}
               <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" aria-label="Open Settings">
                    <Settings className="h-5 w-5" />
                  </Button>
               </SheetTrigger>
            </div>
            {/* Center Info */} 
            <div className="flex-1 text-center text-sm text-gray-400 truncate px-2">
               <div className="font-semibold text-gray-200 truncate">{mangaTitle}</div>
               <div className="truncate">{chapterTitle} | {getPageDisplay()}</div>
            </div>
            {/* Right Buttons (Empty or for future use) */} 
            <div className="flex items-center gap-2 w-16"> {/* Keep placeholder width for balance */} 
               {/* Settings button removed from here */} 
            </div>
          </div>
        </header>

        {/* Image Display Area */} 
        <main className="flex-1 flex flex-col items-center justify-center py-4 relative">
          <div className={cn(
            "flex items-center justify-center w-full h-full",
            viewMode === 'single' ? "max-w-3xl" : "max-w-6xl" // Allow wider container for double view
          )}>
            {/* Single Page View */}
            {viewMode === 'single' && pages.length > 0 && currentPage >= 1 && currentPage <= pages.length && (
                <Image
                  key={`${chapterKey}-${pages[currentPage - 1]}-single`}
                  src={pages[currentPage - 1]}
                  alt={`Page ${currentPage} of ${chapterTitle}`}
                  width={900} 
                  height={1400}
                  priority={currentPage === 1}
                  className="max-h-[calc(100vh-120px)] w-auto object-contain select-none"
                  unoptimized 
                />
            )}

            {/* Double Page View */}
            {viewMode === 'double' && pages.length > 0 && currentPage >= 1 && currentPage <= totalPages && (
              <div className="flex justify-center items-start gap-2 w-full">
                {/* Left Page */} 
                <div className="w-1/2 flex justify-end">
                  <Image
                    key={`${chapterKey}-${pages[currentPage - 1]}-double-left`}
                    src={pages[currentPage - 1]}
                    alt={`Page ${currentPage} of ${chapterTitle}`}
                    width={700} // Adjust width for side-by-side
                    height={1100} // Adjust height for side-by-side
                    priority={currentPage === 1}
                    className="max-h-[calc(100vh-120px)] w-auto object-contain select-none"
                    unoptimized 
                  />
                </div>
                {/* Right Page (Conditional) */} 
                <div className="w-1/2 flex justify-start">
                  {(currentPage + 1 <= totalPages) && (
                    <Image
                      key={`${chapterKey}-${pages[currentPage]}-double-right`}
                      src={pages[currentPage]} // Use currentPage index for the second page
                      alt={`Page ${currentPage + 1} of ${chapterTitle}`}
                      width={700} // Adjust width for side-by-side
                      height={1100} // Adjust height for side-by-side
                      priority={currentPage === 1} // Prioritize if it's page 2
                      className="max-h-[calc(100vh-120px)] w-auto object-contain select-none"
                      unoptimized 
                    />
                  )}
                   {/* Placeholder if only one page left */} 
                   {(currentPage + 1 > totalPages) && (
                      <div className="w-[700px] h-[1100px] max-h-[calc(100vh-120px)]"></div>
                   )}
                </div>
              </div>
            )}
            
            {/* Loading/Error Placeholder (Simplified) */} 
            {(pages.length === 0 || currentPage < 1 || currentPage > totalPages) && (
               <div className="text-gray-500">Loading page...</div>
            )}
          </div>
        </main>

        {/* Clickable Overlay Navigation Areas - Stop above footer */}
        <div className="fixed inset-x-0 top-0 bottom-20 z-20 flex justify-between pointer-events-none">
          {/* Left Click Area */} 
          <button
            className="w-1/2 h-full pointer-events-auto cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:pointer-events-none group"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            aria-label="Previous Page"
          >
             {/* Optional: Add subtle hover effect, maybe a gradient? */}
             {/* <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div> */}
          </button>

          {/* Right Click Area */} 
          <button
            className="w-1/2 h-full pointer-events-auto cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:pointer-events-none group"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            aria-label="Next Page"
          >
             {/* Optional: Add subtle hover effect */}
             {/* <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div> */}
          </button>
        </div>

        {/* Footer Navigation - Always visible now */} 
        <footer className="sticky bottom-0 bg-black/80 backdrop-blur-sm border-t border-gray-800 py-3 z-10">
          <div className="container mx-auto px-4 flex flex-col items-center gap-3">
            {/* Progress Bar */}
            {totalPages > 1 && (
              <PageProgressBar 
                currentPage={currentPage}
                totalPages={totalPages}
                className="w-full max-w-md"
              />
            )}
            {/* Button Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="border-gray-700 text-gray-300"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="px-4 text-sm text-gray-400 min-w-[80px] text-center">
                {getPageDisplay()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="border-gray-700 text-gray-300"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </footer>
      </div>

      {/* Settings Sheet Content */}
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Reader Settings</SheetTitle>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          {/* View Mode Setting */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Page View</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleViewMode} 
              className="w-[100px]"
            >
              {viewMode === 'single' ? 
                <><Columns className="h-4 w-4 mr-2" /> Double</> : 
                <><Square className="h-4 w-4 mr-2" /> Single</>}
            </Button>
          </div>

          {/* Theme Setting */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>

          {/* Add other settings here later */}
        </div>
      </SheetContent>
    </Sheet>
  );
} 