"use client"

import { BoardOptions, ShapeType } from "@/lib/types"
import React, { createContext, SetStateAction, useContext, useState } from "react"

interface ShapeContextType {
    currentShape:ShapeType;
    setCurrentShape:React.Dispatch<SetStateAction<ShapeType>>;
}
const shapeContext = createContext<ShapeContextType | undefined>(undefined)

export const ShapeContextProvider = ({ children}:{children:React.ReactNode})=>{
    const [currentShape,setCurrentShape] = useState<ShapeType>('Square')

    return (
        <shapeContext.Provider value={{currentShape,setCurrentShape}}>
{children}
        </shapeContext.Provider>
    )
}

export const useShapeContext    = ()=>{
    const context = useContext(shapeContext)
    if(!context){
        throw new Error('shapeContext should be wrapped within a provider!')
    }
    return context;
}