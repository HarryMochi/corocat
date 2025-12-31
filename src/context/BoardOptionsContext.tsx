"use client"

import { BoardOptions } from "@/lib/types"
import React, { createContext, SetStateAction, useContext, useState } from "react"

interface BoardOptionsType {
    currentOption:BoardOptions;
    setCurrentOption:React.Dispatch<SetStateAction<BoardOptions>>;
}
const boardOptionsContext = createContext<BoardOptionsType | undefined>(undefined)

export const BoardOptionsProvider = ({ children}:{children:React.ReactNode})=>{
    const [currentOption,setCurrentOption] = useState<BoardOptions>('Draw')

    return (
        <boardOptionsContext.Provider value={{currentOption,setCurrentOption}}>
{children}
        </boardOptionsContext.Provider>
    )
}

export const useBoardOptions    = ()=>{
    const context = useContext(boardOptionsContext)
    if(!context){
        throw new Error('useBoardOptions should be wrapped within a provider!')
    }
    return context;
}