"use server";

// Remove ProxySource import from gist, as it's now just a string
// import { ProxySource } from "./gist"; 
import { fetchImgurAlbumPages } from "./imgur";

// Add imports for other source fetchers here later

/**
 * Resolves a source path string to an array of image URLs.
 * 
 * @param sourcePath The source path string (e.g., "/proxy/api/imgur/chapter/abc/").
 * @returns A promise resolving to an array of image URLs.
 */
export async function resolveSourcePages(sourcePath: string): Promise<string[]> {
  console.log(`Resolving source path: ${sourcePath}`);

  // --- Imgur Path Matching --- 
  // Matches "/proxy/api/imgur/chapter/{albumId}/"
  const imgurMatch = sourcePath.match(/\/proxy\/api\/imgur\/chapter\/([a-zA-Z0-9]+)\/?/);
  if (imgurMatch && imgurMatch[1]) {
    const albumId = imgurMatch[1];
    console.log(`Detected Imgur source. Album ID: ${albumId}`);
    try {
      return await fetchImgurAlbumPages(albumId);
    } catch (error) {
      console.error(`Failed to resolve Imgur source (Album: ${albumId}):`, error);
      throw new Error(`Failed to load pages from Imgur album ${albumId}.`);
    }
  }

  // --- Add checks for other source path patterns here --- 
  /*
  // Example: Direct URLs (if we add a schema for it later)
  if (sourcePath.startsWith("/proxy/api/direct/")) { 
    // Logic to parse direct URLs 
  }
  */

  // --- Fallback for unknown/unsupported paths --- 
  console.error(`Unsupported or unrecognized source path format: ${sourcePath}`);
  throw new Error(`Unsupported source path format: ${sourcePath}`);
} 