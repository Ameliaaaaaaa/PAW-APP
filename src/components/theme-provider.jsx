'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const ThemeContext = createContext({
    theme: 'system',
    setTheme: () => {}
});

export const useThemeContext = () => useContext(ThemeContext);

export function ThemeProvider({ children, ...props }) {
    const [theme, setTheme] = useState('dark');
  
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme) setTheme(savedTheme);
    }, []);
  
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <NextThemesProvider {...props} attribute="class" defaultTheme="dark" enableSystem value={{ light: 'light', dark: 'dark', modstmous: 'modstmous', puppyDark: 'puppyDark' }}>
                {children}
            </NextThemesProvider>
        </ThemeContext.Provider>
    );
};