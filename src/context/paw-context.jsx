'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { fetch } from '@tauri-apps/plugin-http';
import { error } from '@tauri-apps/plugin-log';

const BASE_URL = 'https://paw-api.amelia.fun';

const PAWContext = createContext(null);

export function PAWProvider({ children }) {
    const [currentVersion, setCurrentVersion] = useState('0.0.0');

    useEffect(() => {
        const setVersion = async () => {
            setCurrentVersion(await getVersion());
        };

        setVersion();
    }, []);

    const fetchLatestVersion = async () => {
        try {
            const response = await fetch('https://api.github.com/repos/Ameliaaaaaaa/PAW-APP/releases/latest', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${currentVersion}`
                }
            });

            return {
                success: response.ok,
                version: response.ok ? (await response.json()).name : '0.0.0'
            };
        } catch (e) {
            error(e);

            return {
                success: false
            };
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${currentVersion}`
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
                    'User-Agent': `PAW-APP/${currentVersion}`
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
                    'User-Agent': `PAW-APP/${currentVersion}`
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

    const fetchAvatar = async (avatarId) => {
        try {
            const response = await fetch(`${BASE_URL}/avatar?avatarId=${avatarId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${currentVersion}`
                }
            });

            return {
                success: response.ok,
                result: response.ok ? (await response.json()).result : null
            };
        } catch (e) {
            error(e);

            return {
                success: false
            };
        }
    };

    const fetchRandomAvatars = async () => {
        try {
            const response = await fetch(`${BASE_URL}/random`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${currentVersion}`
                }
            });

            return {
                success: response.ok,
                results: response.ok ? (await response.json()).results : []
            };
        } catch (e) {
            error(e);

            return {
                success: false
            };
        }
    };

    const fetchRecentAvatars = async (orderBy) => {
        try {
            const response = await fetch(`${BASE_URL}/recent/${orderBy}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${currentVersion}`
                }
            });

            return {
                success: response.ok,
                results: response.ok ? (await response.json()).results : []
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
            fetchLatestVersion,
            fetchStats,
            searchAvatars,
            refreshAvatar,
            fetchAvatar,
            fetchRandomAvatars,
            fetchRecentAvatars
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