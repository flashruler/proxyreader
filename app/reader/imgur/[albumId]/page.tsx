import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchImgurAlbumPages } from "@/lib/imgur"; // Ensure this function can run server-side
import { ImgurReaderClient } from "@/components/reader/imgur-reader-client"; // Import the new client component

// Interface for page parameters
interface ImgurReaderPageParams {
  albumId: string;
}

// Server Component Page
export default async function ImgurReaderPage({ params }: { params: ImgurReaderPageParams }) {
  const { albumId } = params;

  // Validate params - Server-side check
  if (!albumId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4 px-4">
        <h2 className="text-xl font-semibold text-red-500">Invalid Parameters</h2>
        <p className="text-gray-400 text-center">Missing Imgur Album ID.</p>
        <Link href="/">
          <Button variant="secondary">
            <Home className="h-4 w-4 mr-2" /> Go Home
          </Button>
        </Link>
      </div>
    );
  }

  let pages: string[] = [];
  let error: string | null = null;

  try {
    // Fetch Imgur pages server-side
    pages = await fetchImgurAlbumPages(albumId);
    if (pages.length === 0) {
        // Treat empty album as a soft error/warning, let client handle display
        console.warn(`No pages found for Imgur album ${albumId}`);
    }

  } catch (err: unknown) {
    console.error(`Error loading Imgur album ${albumId} data on server:`, err);
    error = err instanceof Error ? `Failed to load album: ${err.message}` : "An unknown error occurred during server-side data fetching.";
    pages = []; // Ensure pages is empty on error
  }

  // --- Server-Side Render Logic --- 

  // Handle fatal errors during fetch
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4 px-4">
        <h2 className="text-xl font-semibold text-red-500">Error Loading Album</h2>
        <p className="text-gray-400 text-center">{error}</p>
        <div className="flex gap-4 mt-4">
          {/* Guide user back home on server error */}
          <Link href="/">
            <Button variant="secondary">
              <Home className="h-4 w-4 mr-2" /> Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Render the Client Component with fetched data
  return (
    <ImgurReaderClient 
      albumId={albumId}
      initialPages={pages} // Pass the resolved pages
    />
  );
} 