import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchGistConfig, GistConfig } from "@/lib/gist";
import { resolveSourcePages } from "@/lib/source-resolver";
import { GistReaderClient } from "@/components/reader/gist-reader-client"; // Import the new client component

// Interface for page parameters
interface GistReaderPageParams {
  gistId: string;
  chapter: string; // Chapter number/key as a string
}

// Server Component Page
export default async function GistReaderPage({ params }: { params: GistReaderPageParams }) {
  const { gistId, chapter: chapterKey } = params;

  // Validate params - Server-side check
  if (!gistId || !chapterKey) {
    // Handle invalid params appropriately, maybe redirect or show an error page
    // For now, rendering a simple error message
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4 px-4">
        <h2 className="text-xl font-semibold text-red-500">Invalid Parameters</h2>
        <p className="text-gray-400 text-center">Missing Gist ID or Chapter Key.</p>
        <Link href="/">
          <Button variant="secondary">
            <Home className="h-4 w-4 mr-2" /> Go Home
          </Button>
        </Link>
      </div>
    );
  }

  let config: GistConfig | null = null;
  let pages: string[] = [];
  let error: string | null = null;

  try {
    // Fetch Gist config
    config = await fetchGistConfig(gistId);

    // Find the chapter data
    const chapterData = config?.chapters[chapterKey];
    if (!chapterData) {
      throw new Error(`Chapter '${chapterKey}' not found in Gist configuration.`);
    }

    // Resolve source path
    const groupKeys = Object.keys(chapterData.groups || {});
    if (groupKeys.length === 0) {
      throw new Error(`No image source groups found for Chapter '${chapterKey}'.`);
    }
    const sourcePath = chapterData.groups[groupKeys[0]];
    if (!sourcePath || typeof sourcePath !== 'string') {
      throw new Error(`Invalid source path found for Chapter '${chapterKey}' (Group: ${groupKeys[0]}). Expected a string.`);
    }

    // Resolve pages
    pages = await resolveSourcePages(sourcePath);
    if (pages.length === 0) {
        // It's debatable if this is an *error* or just an empty chapter.
        // For now, let the client component handle displaying "0 pages".
        console.warn(`No pages resolved for Gist ${gistId}, Chapter ${chapterKey}, Source ${sourcePath}`);
    }

  } catch (err: unknown) {
    console.error("Error loading Gist/Chapter data on server:", err);
    error = err instanceof Error ? `Failed to load chapter: ${err.message}` : "An unknown error occurred during server-side data fetching.";
    // config might be partially loaded if fetching pages failed, keep it if available
    // pages will be empty
  }

  // --- Server-Side Render Logic --- 

  // Handle fatal errors during fetch
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4 px-4">
        <h2 className="text-xl font-semibold text-red-500">Error Loading Chapter</h2>
        <p className="text-gray-400 text-center">{error}</p>
        <div className="flex gap-4 mt-4">
          {/* Cannot offer retry on server easily, guide user back */}
          <Link href={`/info/gist/${gistId}`}>
             <Button variant="outline">
                Back to Info
             </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">
              <Home className="h-4 w-4 mr-2" /> Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If config is still null after try/catch (shouldn't happen unless fetchGistConfig itself fails badly)
  if (!config) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4 px-4">
        <h2 className="text-xl font-semibold text-red-500">Error Loading Configuration</h2>
        <p className="text-gray-400 text-center">Could not load the Gist configuration.</p>
         <Link href="/">
            <Button variant="secondary">
              <Home className="h-4 w-4 mr-2" /> Go Home
            </Button>
          </Link>
      </div>
    );
  }

  // Render the Client Component with fetched data
  return (
    <GistReaderClient 
      gistId={gistId}
      initialChapterKey={chapterKey}
      initialPages={pages} // Pass the resolved pages
      initialConfig={config} // Pass the full config
    />
  );
} 