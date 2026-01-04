'use client'

import type { Design } from '@/types/design'

interface DesignGridProps {
  designs: Design[]
  selectedDesign: Design | null
  onSelectDesign: (design: Design) => void
}

export default function DesignGrid({ designs, selectedDesign, onSelectDesign }: DesignGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {designs.map((design) => (
        <div
          key={design.id}
          onClick={() => onSelectDesign(design)}
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            selectedDesign?.id === design.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <h3 className="text-xl font-semibold mb-2">{design.name}</h3>
          <p className="text-sm text-gray-600 mb-4">{design.description}</p>
          <div className="flex gap-2 items-center">
            <div
              className="w-8 h-8 rounded border border-gray-300"
              style={{ backgroundColor: design.fgColor }}
            />
            <div
              className="w-8 h-8 rounded border border-gray-300"
              style={{ backgroundColor: design.bgColor }}
            />
            <span className="text-xs text-gray-500 ml-2">
              {design.style} / {design.cornerStyle}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

