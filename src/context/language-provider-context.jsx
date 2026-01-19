'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const translations = {
    en: () => import('../../translations/en.json').then((module) => module.default)
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState(null);

    useEffect(() => {
        const setLanguage = async () => {
            const loadedLang = await translations['en']();

            setLang(loadedLang);
            setLoading(false);
        };

        setLanguage();
    }, []);

    const t = (key, lang, variables = {}) => {
        const keys = key.split('.');
        let value = lang;

        for (const k of keys) {
            value = value?.[k];
        }

        if (typeof value !== 'string') return key;

        return value.replace(/\{(\w+)\}/g, (match, varName) => {
            return variables[varName] !== undefined ? variables[varName] : match;
        });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-4 text-muted-foreground">Initializing...</p>
                </div>
            </div>
        );
    }

    return (
        <LanguageContext.Provider value={{ lang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) throw new Error('useLanguage must be used within a LanguageProvider');

    return context;
}