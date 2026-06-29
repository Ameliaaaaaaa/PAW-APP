'use client';

import { ThemeProvider as NextThemesProvider, useTheme, UseThemeProps } from 'next-themes';
import { createContext } from 'react';

const ThemeContext: any = createContext({
    theme: 'system',
    setTheme: (): void => {}
});

export const useThemeContext: () => UseThemeProps = (): UseThemeProps => {
    return useTheme();
};

export function ThemeProvider({ children, ...props }: any): JSX.Element {
    return (
        <NextThemesProvider
            {...props} attribute="class" defaultTheme="dark" enableSystem themes={['light', 'dark', 'modstmous', 'puppyDark']} storageKey="theme">
            {children}
        </NextThemesProvider>
    );
}