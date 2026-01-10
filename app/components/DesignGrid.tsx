'use client'

import type { Design } from '@/types/design'

interface DesignGridProps {
  designs: Design[]
  selectedDesign: Design | null
  onSelectDesign: (design: Design) => void
}

export default function DesignGrid({ designs, selectedDesign, onSelectDesign }: DesignGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {designs.map((design, index) => (
        <button
          key={design.id}
          onClick={() => onSelectDesign(design)}
          className={`
            group relative p-5 text-left rounded-2xl border-2 transition-all duration-300
            ${selectedDesign?.id === design.id
              ? 'border-[#E6A24C] bg-gradient-to-br from-[#E6A24C]/5 to-[#E6A24C]/10 ring-2 ring-[#E6A24C]/20 shadow-lg shadow-[#E6A24C]/10'
              : 'border-[#171158]/10 hover:border-[#171158]/30 hover:bg-[#171158]/[0.02] hover:shadow-md'
            }
          `}
        >
          {/* Selected Badge */}
          {selectedDesign?.id === design.id && (
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-[#E6A24C] to-[#D4923D] rounded-full flex items-center justify-center shadow-lg shadow-[#E6A24C]/30">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Design Number */}
          <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-[#171158] to-[#1B1723] text-white text-xs font-bold rounded-xl flex items-center justify-center shadow-md">
            {index + 1}
          </div>

          {/* Content */}
          <div className="mt-7">
            <h4 className="text-base font-bold text-[#1B1723] mb-1">{design.name}</h4>
            <p className="text-sm text-[#1B1723]/60 line-clamp-2 mb-4">{design.description}</p>

            {/* Colors & Style */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg shadow-md ring-2 ring-white"
                  style={{ backgroundColor: design.fgColor }}
                  title={`前景色: ${design.fgColor}`}
                />
                <div
                  className="w-7 h-7 rounded-lg shadow-md ring-2 ring-white"
                  style={{ backgroundColor: design.bgColor }}
                  title={`背景色: ${design.bgColor}`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 text-xs font-semibold text-[#171158] bg-[#171158]/5 rounded-lg">
                  {design.style}
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold text-[#171158] bg-[#171158]/5 rounded-lg">
                  {design.cornerStyle}
                </span>
              </div>
            </div>
          </div>

          {/* Hover Effect Indicator */}
          <div className={`
            absolute inset-0 rounded-2xl border-2 border-[#E6A24C] opacity-0 transition-opacity duration-300
            ${selectedDesign?.id !== design.id ? 'group-hover:opacity-40' : ''}
          `} />
        </button>
      ))}
    </div>
  )
}
