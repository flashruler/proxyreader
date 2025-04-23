"use client"; // Need client component for form handling

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Github, Image as ImageIcon } from 'lucide-react'; // Added ImageIcon
import { Separator } from "@/components/ui/separator"; // Added Separator

export default function Home() {
  const [gistSource, setGistSource] = useState('');
  const [imgurSource, setImgurSource] = useState('');
  const router = useRouter();

  // --- Gist Input Handling ---
  const handleGistInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGistSource(event.target.value.trim());
  };

  const handleGistSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gistSource) return;

    let gistId: string | null = null;

    // Try to extract Gist ID from standard Gist URL
    const gistUrlMatch = gistSource.match(/gist\.github\.com\/(?:[\w\-]+\/)?([a-fA-F0-9]+)/);
    if (gistUrlMatch && gistUrlMatch[1]) {
      gistId = gistUrlMatch[1];
    } else {
      // Try to extract Gist ID from raw content URL
      const rawUrlMatch = gistSource.match(/raw\.githubusercontent\.com\/[^\/]+\/([a-fA-F0-9]+)\/raw\//);
      if (rawUrlMatch && rawUrlMatch[1]) {
        gistId = rawUrlMatch[1];
      } else if (/^[a-fA-F0-9]+$/.test(gistSource)) {
        gistId = gistSource;
      }
    }
    
    if (gistId) {
      // Navigate to the INFO page instead of directly to the reader
      router.push(`/info/gist/${gistId}`);
    } else {
      alert("Invalid Gist URL or ID format. Please provide a valid GitHub Gist URL (standard or raw) or just the ID.");
    }
  };

  // --- Imgur Input Handling ---
  const handleImgurInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImgurSource(event.target.value.trim());
  };

  const handleImgurSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imgurSource) return;
    const imgurMatch = imgurSource.match(/imgur\.com\/(?:gallery\/|a\/)([a-zA-Z0-9]+)/);
    if (imgurMatch && imgurMatch[1]) {
      router.push(`/reader/imgur/${imgurMatch[1]}`);
    } else if (/^[a-zA-Z0-9]+$/.test(imgurSource)) {
      router.push(`/reader/imgur/${imgurSource}`);
    } else {
      alert("Invalid Imgur Album URL or ID format.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100 dark:bg-gray-900">
      <main className="flex flex-col items-center gap-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center gap-3 text-2xl font-semibold text-gray-800 dark:text-gray-200">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1>Proxy Reader</h1> 
        </div>
        
        {/* --- Gist Input Section --- */}
        <section className="w-full flex flex-col gap-3 pt-4">
          <h2 className="text-lg font-medium text-center text-gray-700 dark:text-gray-300">Load from Gist</h2>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 -mt-2 mb-2">
            Use a GitHub Gist containing a JSON configuration.
          </p>
          <form onSubmit={handleGistSubmit} className="w-full flex flex-col gap-3">
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="text"
                value={gistSource}
                onChange={handleGistInputChange}
                placeholder="Gist URL or ID"
                className="pl-9" 
              />
            </div>
            <Button type="submit" disabled={!gistSource} className="w-full">
              Load Gist
            </Button>
          </form>
        </section>

        <Separator className="my-4" />

        {/* --- Imgur Input Section --- */}
        <section className="w-full flex flex-col gap-3">
           <h2 className="text-lg font-medium text-center text-gray-700 dark:text-gray-300">Load from Imgur</h2>
           <p className="text-sm text-center text-gray-500 dark:text-gray-400 -mt-2 mb-2">
             Read directly from a public Imgur album.
          </p>
          <form onSubmit={handleImgurSubmit} className="w-full flex flex-col gap-3">
             <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="text"
                value={imgurSource}
                onChange={handleImgurInputChange}
                placeholder="Imgur Album URL or ID"
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={!imgurSource} className="w-full">
              Open Imgur Album
            </Button>
          </form>
        </section>

      </main>

      <footer className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        A Personal project by <a href="https://edlweiss.me" className="underline">Edelweiss</a>
        <p>Inspired by <a href="https://cubari.moe/" className="underline">Cubari.moe</a>  by Guya.moe</p>
      </footer>
    </div>
  );
}
