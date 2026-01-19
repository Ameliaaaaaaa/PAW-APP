'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { createContext } from 'react';

const ThemeContext = createContext({
    theme: 'system',
    setTheme: () => {}
});

export const useThemeContext = () => {
    const context = useTheme();
    return context;
};

export function ThemeProvider({ children, ...props }) {
    return (
        <NextThemesProvider
            {...props}
            attribute="class"
            defaultTheme="dark"
            enableSystem
            themes={['light', 'dark', 'modstmous', 'puppyDark']}
            storageKey="theme"
        >
            {children}
        </NextThemesProvider>
    );
}