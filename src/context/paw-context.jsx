'use client';

import { createContext, useContext } from 'react';
import { fetch } from '@tauri-apps/plugin-http';
import { error } from '@tauri-apps/plugin-log';

const BASE_URL = 'https://paw-api.amelia.fun';

const PAWContext = createContext(null);

export function PAWProvider({ children }) {
    const fetchStats = async () => {
        try {
            const response = await fetch(BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'PAW-APP/0.0.1'
                }
            });
        
            return {
                success: response.ok,
                stats: response.ok ? (await response.json()).stats : null
            };
        } catch (e) {
            error(e);

            return {
                success: false
            };
        }
    };

    const searchAvatars = async () => {};

    const refreshAvatar = async (avatarId) => {
        try {
            const response = await fetch(`${BASE_URL}/update?avatarId=${avatarId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'PAW-APP/0.0.1'
                }
            });

            return {
                success: response.ok
            };
        } catch (e) {
            error(e);

            return {
                success: false
            };
        }
    };

    return (
        <PAWContext.Provider
        value={{
            fetchStats,
            searchAvatars,
            refreshAvatar
        }}
        >
            {children}
        </PAWContext.Provider>
    );
};

export function usePAW() {
    const context = useContext(PAWContext);
  
    if (!context) throw new Error('usePAW must be used within a PAWProvider');
    
    return context;
};