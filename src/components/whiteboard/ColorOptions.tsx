import { useColor } from '@/context/ColorContext'
import { Plus } from 'lucide-react'
import React, { useState } from 'react'

const DEFAULT_COLORS = [
  '#000000',
  '#EF4444',
  '#22C55E',
]

const ColorOptions = () => {
  const { currentColor, setCurrentColor } = useColor()
  const [colors, setColors] = useState(DEFAULT_COLORS)

  const addColor = () => {
    const newColor = prompt('Enter hex color (e.g. #ff0000)')
    if (newColor && /^#([0-9A-F]{3}){1,2}$/i.test(newColor)) {
      setColors(prev => [...prev, newColor])
    }
  }

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md p-1 w-12 max-h-64 ">
      {colors.map(color => {
        const active = currentColor === color

        return (
          <button
            key={color}
            onClick={() => setCurrentColor(color)}
            className={`
              w-10 h-10 rounded-md flex items-center justify-center mb-1
              transition-colors
              ${active ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100'}
            `}
          >
            <div
              className="w-5 h-5 rounded-full border"
              style={{ backgroundColor: color }}
            />
          </button>
        )
      })}

      {/* ➕ Add Color */}
      <button
        onClick={addColor}
        className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100"
      >
        <Plus className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  )
}

export default ColorOptions
