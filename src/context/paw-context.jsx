'use client';

import { createContext, useContext } from 'react';
import { fetch } from '@tauri-apps/plugin-http';
import { error } from '@tauri-apps/plugin-log';

const BASE_URL = 'https://paw-api.amelia.fun';
const USER_AGENT = 'PAW-APP/0.2.0';

const PAWContext = createContext(null);

export function PAWProvider({ children }) {
    const fetchStats = async () => {
        try {
            const response = await fetch(BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': USER_AGENT
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

    const searchAvatars = async (type, query, platforms, pageRef, orderBy) => {
        try {
            const response = await fetch(`${BASE_URL}/search?${new URLSearchParams({
                type: type,
                query: query,
                platforms: platforms,
                page: pageRef.current.toString(),
                order: orderBy
            })}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': USER_AGENT
                }
            });
        
            return {
                success: response.ok,
                data: response.ok ? await response.json() : null
            };
        } catch (e) {
            error(e);

            return {
                success: false
            };
        }
    };

    const refreshAvatar = async (avatarId) => {
        try {
            const response = await fetch(`${BASE_URL}/update?avatarId=${avatarId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': USER_AGENT
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