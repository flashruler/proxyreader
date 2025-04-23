"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Home, List, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHotkeys } from "@/hooks/useHotkeys"

export default function ReaderPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 24 // Example total pages

  // Mock manga pages - in a real app, these would come from your API/database
  const pages = Array.from({ length: totalPages }, (_, i) => ({
    id: i + 1,
    url: `/placeholder.svg?height=1400&width=900&text=Page ${i + 1}`,
  }))

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      window.scrollTo(0, 0)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      window.scrollTo(0, 0)
    }
  }

  // Keyboard navigation
  useHotkeys([
    { key: "ArrowRight", callback: goToNextPage },
    { key: "ArrowLeft", callback: goToPrevPage },
  ])

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Reader Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <List className="h-4 w-4 mr-2" />
              Chapters
            </Button>
          </div>

          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>

          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Reader Content */}
      <main className="flex-1 flex flex-col items-center py-4">
        <div className="relative max-w-3xl mx-auto">
          <Image
            src={pages[currentPage - 1].url || "/placeholder.svg"}
            alt={`Page ${currentPage}`}
            width={900}
            height={1400}
            priority
            className="max-h-[calc(100vh-120px)] w-auto object-contain"
          />
        </div>
      </main>

      {/* Navigation Controls */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="h-full flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-20 w-20 rounded-full bg-black/20 backdrop-blur-sm pointer-events-auto"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-20 w-20 rounded-full bg-black/20 backdrop-blur-sm pointer-events-auto"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </div>

      {/* Page Navigation */}
      <footer className="sticky bottom-0 bg-black/80 backdrop-blur-sm border-t border-gray-800 py-2">
        <div className="container mx-auto px-4 flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="border-gray-700 text-gray-300"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>

            <div className="px-4 text-sm text-gray-400">
              {currentPage} / {totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="border-gray-700 text-gray-300"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
