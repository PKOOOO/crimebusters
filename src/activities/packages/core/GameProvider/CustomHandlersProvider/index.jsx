import { createContext } from "react";

export const CustomHandlersContext = createContext(null);

export function CustomHandlersProvider({ children, renders, mappers }) { 

    return (
        <CustomHandlersContext.Provider value={{renders, mappers}}>
            {children}
        </CustomHandlersContext.Provider>
    )
}