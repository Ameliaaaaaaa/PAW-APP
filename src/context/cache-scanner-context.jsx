'use client';

import { createContext, useContext, useState } from 'react';

const CacheScannerContext = createContext(null);

export function CacheScannerProvider({ children }) {
    const [enabled, setEnabled] = useState(true);
};

export function useCacheScanner() {
    const context = useContext(CacheScannerContext);
  
    if (!context) throw new Error('useCacheScanner must be used within a CacheScannerProvider');
    
    return context;
};