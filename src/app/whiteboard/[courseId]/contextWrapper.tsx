import React from 'react'
import { BoardOptionsProvider } from '@/context/BoardOptionsContext'
import { ShapeContextProvider } from '@/context/ShapeContext'
import { ColorContextProvider } from '@/context/ColorContext'



const ContextWrapper = ({children}:{children:React.ReactNode}) => {
  return (
   
    <BoardOptionsProvider>
        <ShapeContextProvider>
            <ColorContextProvider>
            
            {children}
            </ColorContextProvider> 
        </ShapeContextProvider>
    </BoardOptionsProvider>
    
    
    
  )
}

export default ContextWrapper;