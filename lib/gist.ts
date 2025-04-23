"use server";

import { z } from 'zod';

// Source types are now implied by the proxy path string format
// We don't need the explicit object structure in the config itself

const chapterSchema = z.object({
  title: z.string(),
  // Allow volume to be a string (potentially empty)
  volume: z.string().optional(), 
  // Groups maps group name (string) to an ARRAY of URL strings
  groups: z.record(z.array(z.string().url())),
})
  // Allow extra fields like last_updated without causing errors
  .passthrough(); 

const gistConfigSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  artist: z.string().optional(),
  author: z.string().optional(),
  cover: z.string().url().optional(),
  chapters: z.record(chapterSchema),
})
  // Also allow extra fields at the top level if needed
  .passthrough(); 

// Type derived from the Zod schema
export type GistConfig = z.infer<typeof gistConfigSchema>;
// ProxySource is now implicitly the string value from the groups record
// We don't export a specific ProxySource type from here anymore

// Simple cache for Gist responses
const gistCache = new Map<string, GistConfig>();

/**
 * Fetches and parses the JSON configuration from a public GitHub Gist.
 * It looks for the first file ending in '.json'.
 * 
 * @param gistId The ID of the GitHub Gist.
 * @returns A promise resolving to the parsed Gist configuration.
 */
export async function fetchGistConfig(gistId: string): Promise<GistConfig> {
  const cacheKey = `gist-${gistId}`;
  if (gistCache.has(cacheKey)) {
    console.log(`[Cache Hit] Fetching Gist config ${gistId}`);
    return gistCache.get(cacheKey)!;
  }
  console.log(`[API Call] Fetching Gist config ${gistId}`);

  const apiUrl = `https://api.github.com/gists/${gistId}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // Optional: Add User-Agent
        // 'User-Agent': 'YourAppName'
      },
      next: { revalidate: 3600 }, // Revalidate cache every hour
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Gist not found (ID: ${gistId}). Check the ID or if the Gist is public.`);
      }
      const errorBody = await response.text();
      console.error(`GitHub Gist API Error (${response.status}): ${errorBody}`);
      throw new Error(`Failed to fetch Gist (ID: ${gistId}, Status: ${response.status})`);
    }

    const gistData = await response.json();

    if (!gistData.files) {
      throw new Error(`Invalid Gist data received for ID: ${gistId}. No files found.`);
    }

    // Find the first JSON file in the Gist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonFile = Object.values(gistData.files).find((file: any) => 
      file.filename?.toLowerCase().endsWith('.json')
    ) as { raw_url?: string; content?: string } | undefined;

    if (!jsonFile) {
      throw new Error(`No JSON file found in Gist (ID: ${gistId}). Please ensure the Gist contains a .json file.`);
    }

    let fileContent: string;
    // Prefer raw_url if available (less likely to be truncated), fallback to content
    if (jsonFile.raw_url) {
      console.log(`Fetching Gist content from raw_url: ${jsonFile.raw_url}`);
      const contentResponse = await fetch(jsonFile.raw_url, { next: { revalidate: 3600 } });
      if (!contentResponse.ok) {
        throw new Error(`Failed to fetch Gist raw content from ${jsonFile.raw_url}`);
      }
      fileContent = await contentResponse.text();
    } else if (jsonFile.content) {
      console.log('Using Gist content directly from API response.');
      fileContent = jsonFile.content;
    } else {
      throw new Error(`Could not retrieve file content for JSON file in Gist (ID: ${gistId}).`);
    }

    // Parse and validate the JSON content using Zod
    const parsedConfig = JSON.parse(fileContent);
    const validatedConfig = gistConfigSchema.parse(parsedConfig);

    gistCache.set(cacheKey, validatedConfig);
    setTimeout(() => gistCache.delete(cacheKey), 60 * 60 * 1000); // Clear after 1 hour

    return validatedConfig;

  } catch (err: unknown) {
    console.error(`Error fetching or parsing Gist config for ID ${gistId}:`, err);
    // Provide a more specific error message
    let errorMessage = "An unknown error occurred while fetching Gist configuration.";
    if (err instanceof Error) {
        errorMessage = err.message; // Use original error message if it's an Error instance
    }
    // Re-throw a generic error or a specific one based on context
    throw new Error(errorMessage);
  }
} 