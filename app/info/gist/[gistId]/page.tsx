"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchGistConfig, GistConfig } from '@/lib/gist';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookText, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";

interface GistInfoPageParams extends Record<string, string | string[] | undefined> {
  gistId: string;
}

// Helper function to sort chapter keys numerically/naturally
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

export default function GistInfoPage() {
  const params = useParams<GistInfoPageParams>();
  const gistId = typeof params.gistId === 'string' ? params.gistId : '';

  const [config, setConfig] = useState<GistConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async (id: string) => {
    if (!id) {
      setError("Invalid Gist ID provided.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedConfig = await fetchGistConfig(id);
      setConfig(fetchedConfig);
    } catch (err: unknown) {
      console.error("Error loading Gist config:", err);
      const message = err instanceof Error ? err.message : "An unknown error occurred while fetching Gist data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig(gistId);
  }, [gistId]);

  // Memoize sorted chapter keys
  const sortedChapterKeys = useMemo(() => {
    if (!config?.chapters) return [];
    return sortChapterKeys(Object.keys(config.chapters));
  }, [config?.chapters]);

  const latestChapterKey = sortedChapterKeys[sortedChapterKeys.length - 1];

  // --- Render States --- 
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200">
        <RefreshCw className="h-12 w-12 animate-spin mb-4" />
        Loading Gist Information...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-black p-4 text-gray-800 dark:text-gray-200">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md text-center max-w-lg border dark:border-gray-700">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error Loading Gist</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 break-words">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => loadConfig(gistId)}> 
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
            <Link href="/">
              <Button variant="secondary"> 
                <ArrowLeft className="h-4 w-4 mr-2" /> Go Back Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-black">
        No configuration data found.
      </div>
    );
  }

  // --- Main Content --- 
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-950 rounded-lg shadow-xl overflow-hidden border border-transparent dark:border-gray-800">
        <div className="p-6 md:flex md:gap-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="md:w-1/4 flex-shrink-0 mx-auto md:mx-0 mb-4 md:mb-0">
            {config.cover ? (
              <Image 
                src={config.cover}
                alt={`${config.title} Cover`}
                width={200} // Adjust size as needed
                height={300}
                className="rounded shadow-md object-cover w-full h-auto max-w-[200px] mx-auto"
                priority
                unoptimized // Needed if cover source is external
              />
            ) : (
              <div className="w-[200px] h-[300px] bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 mx-auto">
                No Cover
              </div>
            )}
          </div>
          <div className="md:w-3/4 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 dark:text-white">{config.title}</h1>
            <div className="text-sm mb-3 space-y-1 text-gray-600 dark:text-gray-300">
              {config.author && <p><span className="font-semibold text-gray-800 dark:text-gray-100">Author:</span> {config.author}</p>}
              {config.artist && <p><span className="font-semibold text-gray-800 dark:text-gray-100">Artist:</span> {config.artist}</p>}
            </div>
            {config.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {config.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {latestChapterKey && (
                <Link href={`/read/gist/${gistId}/${latestChapterKey}`} passHref>
                  <Button>
                    <BookText className="h-4 w-4 mr-2" /> Read Latest Chapter ({latestChapterKey})
                  </Button>
                </Link>
              )}
               <a 
                href={`https://gist.github.com/${gistId}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                 <Button variant="outline">
                  View Gist Source <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
               </a>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Chapters</h2>
          <ScrollArea className="h-[400px] border dark:border-gray-700 rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-100 dark:bg-gray-900 z-10">
                <TableRow className="dark:border-gray-700">
                  <TableHead className="w-[100px] dark:text-gray-200">Chapter</TableHead>
                  <TableHead className="dark:text-gray-200">Title</TableHead>
                  {/* Add other columns like Group or Date later if needed */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedChapterKeys.length > 0 ? (
                  sortedChapterKeys.map((key) => {
                    const chapter = config.chapters[key];
                    return (
                      <TableRow key={key} className="hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700">
                        <TableCell className="font-medium dark:text-gray-100">{key}</TableCell>
                        <TableCell>
                          <Link 
                            href={`/read/gist/${gistId}/${key}`} 
                            className="hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            {chapter.title || `Chapter ${key}`}
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 dark:text-gray-400">
                      No chapters found in the configuration.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/" passHref>
            <Button variant="link" className="dark:text-gray-400 dark:hover:text-gray-200">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
        </Link>
      </div>
    </div>
  );
} 