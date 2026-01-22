import {
  Circle,
  Eraser,
  LassoSelect,
  Pen,
  RectangleHorizontal,
  Redo,
  Undo,
  Type,
} from 'lucide-react'
import React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CanvasMode, LayerType, CanvasState } from '@/lib/types'

interface BoardOptionsProps {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Helper to get layerType from canvasState (only exists in Inserting mode)
const getLayerType = (state: CanvasState): LayerType | undefined => {
  if (state.mode === CanvasMode.Inserting && 'layerType' in state) {
    return state.layerType
  }
  return undefined
}

// Map CanvasMode back to your option names for active state
const canvasModeToOption = (state: CanvasState): string => {
  const layerType = getLayerType(state)

  switch (state.mode) {
    case CanvasMode.None:
    case CanvasMode.Translating:
    case CanvasMode.SelectionNet:
    case CanvasMode.Pressing:
    case CanvasMode.Resizing:
      return 'Select'
    case CanvasMode.Pencil:
      return 'Draw'
    case CanvasMode.Inserting:
      switch (layerType) {
        case LayerType.Rectangle:
          return 'Rectangle'
        case LayerType.Ellipse:
          return 'Circle'
        case LayerType.Text:
          return 'Text'
        default:
          return 'Select'
      }
    default:
      return 'Select'
  }
}

const BoardOptions = ({
  canvasState,
  setCanvasState,
  undo,
  redo,
  canUndo,
  canRedo
}: BoardOptionsProps) => {
  const baseIcon = 'w-4 h-4'

  const getCurrentOption = () => {
    return canvasModeToOption(canvasState)
  }

  const getCurrentShape = () => {
    const layerType = getLayerType(canvasState)

    if (canvasState.mode === CanvasMode.Inserting) {
      switch (layerType) {
        case LayerType.Ellipse:
          return 'Circle'
        case LayerType.Rectangle:
          return 'Rectangle'
        default:
          return 'Rectangle' // Default to rectangle
      }
    }
    return 'Rectangle' // Default shape
  }

  const handleOptionClick = (optionName: string) => {
    switch (optionName) {
      case 'Select':
        setCanvasState({ mode: CanvasMode.None })
        break
      case 'Draw':
        setCanvasState({ mode: CanvasMode.Pencil })
        break
      case 'Text':
        setCanvasState({
          mode: CanvasMode.Inserting,
          layerType: LayerType.Text
        })
        break
      case 'Eraser':
        // Handle eraser functionality - you might want to implement this differently
        // If you have CanvasMode.Eraser, use that instead
        setCanvasState({ mode: CanvasMode.Pencil }) // Temporary: using Pencil mode for eraser
        break
      case 'Undo':
        undo()
        break
      case 'Redo':
        redo()
        break
      default:
        setCanvasState({ mode: CanvasMode.None })
    }
  }

  const handleShapeSelect = (shapeName: string) => {
    if (shapeName === 'Circle') {
      setCanvasState({
        mode: CanvasMode.Inserting,
        layerType: LayerType.Ellipse
      })
    } else if (shapeName === 'Rectangle') {
      setCanvasState({
        mode: CanvasMode.Inserting,
        layerType: LayerType.Rectangle
      })
    }
  }

  const getShapeIcon = (active: boolean) => {
    const currentShape = getCurrentShape()
    const cls = `${baseIcon} ${active ? 'text-blue-600' : 'text-gray-700'}`
    if (currentShape === 'Circle') return <Circle className={cls} />
    return <RectangleHorizontal className={cls} />
  }

  const options = [
    { name: 'Select', icon: (a: boolean) => <LassoSelect className={`${baseIcon} ${a ? 'text-blue-600' : 'text-gray-700'}`} /> },
    { name: 'Draw', icon: (a: boolean) => <Pen className={`${baseIcon} ${a ? 'text-blue-600' : 'text-gray-700'}`} /> },
    { name: 'Text', icon: (a: boolean) => <Type className={`${baseIcon} ${a ? 'text-blue-600' : 'text-gray-700'}`} /> },
    { name: 'Shapes' },

    { name: 'Undo', icon: (a: boolean) => <Undo className={`${baseIcon} ${a ? 'text-blue-600' : 'text-gray-700'}`} /> },
    { name: 'Redo', icon: (a: boolean) => <Redo className={`${baseIcon} ${a ? 'text-blue-600' : 'text-gray-700'}`} /> },
  ]

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md p-1 w-12">
      {options.map(option => {
        const active = getCurrentOption() === option.name
        const shapeActive = getCurrentOption() === getCurrentShape()

        /* ---------- SHAPES WITH DROPDOWN ---------- */
        if (option.name === 'Shapes') {
          return (
            <Popover key="Shapes">
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      onClick={() => handleOptionClick('Shapes')}
                      className={`
                        w-10 h-10 flex items-center justify-center rounded-md
                        transition-colors
                        ${shapeActive ? 'bg-blue-100' : 'hover:bg-gray-100'}
                      `}
                    >
                      {getShapeIcon(shapeActive)}
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <span>Shapes</span>
                </TooltipContent>
              </Tooltip>

              <PopoverContent
                side="right"
                align="center"
                className="p-1 w-12 bg-white rounded-lg shadow-md"
              >
                <div className="flex flex-col gap-1">
                  {[
                    { name: 'Circle', icon: <Circle className={baseIcon} /> },
                    { name: 'Rectangle', icon: <RectangleHorizontal className={baseIcon} /> },
                  ].map(shape => {
                    const isActive = getCurrentShape() === shape.name

                    return (
                      <Tooltip key={shape.name}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleShapeSelect(shape.name)}
                            className={`
                              w-10 h-10 flex items-center justify-center rounded-md
                              ${isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}
                            `}
                          >
                            {shape.icon}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <span>{shape.name}</span>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )
        }

        /* ---------- NORMAL OPTIONS ---------- */
        return (
          <Tooltip key={option.name}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleOptionClick(option.name)}
                disabled={(option.name === 'Undo' && !canUndo) || (option.name === 'Redo' && !canRedo)}
                className={`
                  w-10 h-10 flex items-center justify-center rounded-md
                  transition-colors
                  ${active ? 'bg-blue-100' : 'hover:bg-gray-100'}
                  ${((option.name === 'Undo' && !canUndo) || (option.name === 'Redo' && !canRedo))
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'}
                `}
              >
                {option.icon?.(active)}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span>{option.name}</span>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export default BoardOptions