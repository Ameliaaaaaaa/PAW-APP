'use client';

import { createContext, useContext } from 'react';

const CacheScannerContext = createContext(null);

export function CacheScannerProvider({ children }) {};

export function useCacheScanner() {
    const context = useContext(CacheScannerContext);
  
    if (!context) throw new Error('useCacheScanner must be used within a CacheScannerProvider');
    
    return context;
};