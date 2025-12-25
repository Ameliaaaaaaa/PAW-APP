'use client';

import { createContext, useContext, useEffect } from 'react';
import { homeDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

const VrcLogContext = createContext(null);

export function VrcLogProvider({ children }) {
    const getRecentlySeen = async () => {
        return await invoke('get_avatar_ids');
    };

    useEffect(() => {
        const startLogWatcher = async () => {
            await invoke('start_log_watcher', {
                path: `${await homeDir()}\\AppData\\LocalLow\\VRChat\\VRChat`
            });

            await invoke('start_log_watcher', {
                path: `${await homeDir()}\\AppData\\Local\\Temp\\VRChat\\VRChat`
            });
        };

        startLogWatcher();
    }, []);

    return (
        <VrcLogContext.Provider
        value={{
            getRecentlySeen
        }}
        >
            {children}
        </VrcLogContext.Provider>
    );
};

export function useVrcLog() {
    const context = useContext(VrcLogContext);
  
    if (!context) throw new Error('useVrcLog must be used within a VrcLogProvider');
    
    return context;
}