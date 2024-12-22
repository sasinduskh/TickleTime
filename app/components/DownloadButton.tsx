'use client'

import { Button } from "@/components/ui/button"
import { Download } from 'lucide-react'

interface DownloadButtonProps {
  onClick: () => void;
}

export function DownloadButton({ onClick }: DownloadButtonProps) {
  return (
    <Button onClick={onClick} className="bg-black text-white hover:bg-gray-800">
      <Download className="mr-2 h-4 w-4" /> Download CSV
    </Button>
  )
}

