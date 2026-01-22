"use client"

import React, { createContext, SetStateAction, useContext, useState } from "react";

interface ColorcontextType  {
  currentColor:string;
  setCurrentColor:React.Dispatch<SetStateAction<string>>;
}

const ColorContext = createContext<ColorcontextType|undefined>(undefined)

export const ColorContextProvider = ({children}:{children:React.ReactNode})=>{
  const [currentColor,setCurrentColor] = useState<string>('#000')

  return (
    <ColorContext.Provider value={{currentColor,setCurrentColor}}>
    {children}
    </ColorContext.Provider>
  )
}

export const useColor =()=>{
    const context = useContext(ColorContext)
    if(!context) throw new Error("Please Wrap ColorContext Within A Provider")
    return context;
}