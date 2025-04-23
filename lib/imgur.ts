"use server"; // Mark this for server-side execution

interface ImgurImage {
  id: string;
  link: string;
  description: string | null;
  type: string;
  // Add other relevant fields if needed
}

interface ImgurAlbumResponse {
  data: ImgurImage[];
  success: boolean;
  status: number;
}

// Simple in-memory cache to avoid repeated API calls during development
const albumCache = new Map<string, string[]>();

/**
 * Fetches image URLs from a public Imgur album.
 * NOTE: In a real application, you MUST use an Imgur API Client ID for authentication.
 * Register your application here: https://api.imgur.com/oauth2/addclient
 * Store your Client ID securely (e.g., in environment variables).
 * 
 * @param albumId The ID of the Imgur album.
 * @returns A promise resolving to an array of image URLs.
 */
export async function fetchImgurAlbumPages(albumId: string): Promise<string[]> {
  const cacheKey = `imgur-${albumId}`;
  if (albumCache.has(cacheKey)) {
    console.log(`[Cache Hit] Fetching Imgur album ${albumId}`);
    return albumCache.get(cacheKey)!;
  }
  console.log(`[API Call] Fetching Imgur album ${albumId}`);

  // --- Production Imgur API Call ---
  const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
  if (!IMGUR_CLIENT_ID) {
    console.error("Imgur Client ID is not set in .env.local");
    // Return empty array or throw error? Throwing is probably better.
    throw new Error("Imgur Client ID is missing. Please set IMGUR_CLIENT_ID in .env.local");
  }
  const apiUrl = `https://api.imgur.com/3/album/${albumId}/images`;
  let pages: string[] = []; // Initialize pages array
  try {
    const response = await fetch(apiUrl, {
      headers: {
        // Make sure the space after Client-ID is correct
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      // Use Next.js caching features
      next: { revalidate: 3600 } // Revalidate cache every hour
    });

    // Improved error handling
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Imgur API Error (${response.status}): ${errorBody}`);
      throw new Error(`Failed to fetch Imgur album (${response.status}): ${response.statusText}. Check album ID and Client ID.`);
    }

    const data = (await response.json()) as ImgurAlbumResponse;

    if (!data.success) {
       console.error(`Imgur API returned success: false for album ${albumId}`);
       throw new Error(`Imgur API reported an issue with album ${albumId}. It might be private or invalid.`);
    }

    // Ensure data.data exists and is an array before filtering/mapping
    if (!Array.isArray(data.data)) {
      console.error(`Imgur API response data.data is not an array for album ${albumId}`);
      throw new Error(`Unexpected response format from Imgur API for album ${albumId}.`);
    }

    pages = data.data
      .filter(img => img.type?.startsWith('image/')) // Ensure type exists before checking
      .map(img => img.link); 

    if (pages.length === 0) {
      console.warn(`No images found in Imgur album ${albumId}. It might be empty or contain non-image files.`);
      // Decide if this is an error or just an empty result
      // return []; // Option: return empty array if no images is acceptable
      throw new Error(`No images found in Imgur album ${albumId}.`); // Option: Treat as error
    }

  } catch (error) {
    // Log the error and re-throw or handle appropriately
    console.error("Error during Imgur API fetch:", error);
    // Re-throw the error so the calling page knows something went wrong
    throw error; 
  }
  // --- End Production Code ---
  
  /* --- Placeholder for Development --- DEACTIVATED
  // Simulate API response without needing a Client ID during development
  console.warn("Using placeholder data for Imgur API. Add your Client ID for real data.");
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  // Simplify the placeholder URL to the absolute minimum
  pages = Array.from({ length: 15 }, (_, i) => 
    `https://via.placeholder.com/900x1400` // Removed text parameter
  );
  if (albumId === 'error') { // Simulate an error case
      throw new Error("Simulated error fetching Imgur album 'error'");
  }
  */ // --- End Placeholder --- DEACTIVATED

  // Only cache successful responses with actual pages
  if (pages.length > 0) {
    albumCache.set(cacheKey, pages);
    // Optional: Clear cache after some time if memory usage is a concern
    setTimeout(() => albumCache.delete(cacheKey), 60 * 60 * 1000); // Clear after 1 hour
  }

  return pages;
} 