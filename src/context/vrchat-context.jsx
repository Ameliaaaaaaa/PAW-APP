'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { load } from '@tauri-apps/plugin-store';
import { fetch } from '@tauri-apps/plugin-http';
import { error } from '@tauri-apps/plugin-log';

const VRChatContext = createContext(null);

export function VRChatProvider({ children }) {
    const [store, setStore] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const openStore = async () => {
            try {
                const store = await load('store.json', { 
                    autoSave: true
                });

                setStore(store);
            } catch (e) {
                error(e);
            }
        };

        openStore();
    }, []);

    const authUser = async (username, password) => {
        try {
            const response = await fetch('https://vrchat.com/api/1/auth/user', {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    'Authorization': `Basic ${btoa(`${username}:${password}`)}`
                }
            });
    
            const data = response.ok ? await response.json() : null;
            const authCookie = response.headers.get('set-cookie')?.match(/auth=[^;]+/)?.[0];
    
            await store.set('auth', {
                username: username,
                password: password,
                authCookie: authCookie ? authCookie : null,
                twoFactorAuthType: data ? data.requiresTwoFactorAuth[0] : 'none'
            });
    
            return {
                success: response.ok,
                twoFactorAuthType: data ? data.requiresTwoFactorAuth[0] : 'none'
            };
        } catch (e) {
            error(e);

            return {
                success: false
            };
        }
    };

    const verify2fa = async (code) => {
        try {
            const auth = await store.get('auth');

            const response = await fetch(`https://api.vrchat.cloud/api/1/auth/twofactorauth/${auth.twoFactorAuthType}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'PAW-APP/0.1.0 ameliab20081@gmail.com',
                    'Cookie': `${auth.authCookie};`
                },
                body: JSON.stringify({ 
                    code: code
                })
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
    
    const fetchUserInfo = async (authCookie) => {
        try {
            const response = await fetch('https://api.vrchat.cloud/api/1/auth/user', {
                method: 'GET',
                headers: {
                    'User-Agent': 'PAW-APP/0.1.0 ameliab20081@gmail.com',
                    'Cookie': `${authCookie};`
                }
            });

            const data = response.ok ? await response.json() : null;

            if (response.ok) setCurrentUser(data);

            return {
                success: response.ok,
                data: data
            };
        } catch (e) {
            error(e);

            return {
                success: false
            };
        }
    };

    const getUserInfo = async () => {
        if (currentUser) return {
            success: true,
            data: currentUser
        };
    
        try {
            const store = await load('store.json', { 
                autoSave: false
            });

            const auth = await store.get('auth');

            if (auth && auth.authCookie) return await fetchUserInfo(auth.authCookie);
        } catch (e) {
            error(e);
        }
    
        return {
            success: false,
            data: null
        };
    };

    const switchAvatar = async (avatarId) => {
        try {
            const auth = await store.get('auth');

            const response = await fetch(`https://api.vrchat.cloud/api/1/avatars/${avatarId}/select`, {
                method: 'PUT',
                headers: {
                    'User-Agent': 'PAW-APP/0.1.0 ameliab20081@gmail.com',
                    'Cookie': `${auth.authCookie};`
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

    const logout = async () => {
        try {
            setCurrentUser(null);
        
            await store.delete('auth');

            return {
                success: true
            };
        } catch(e) {
            error(e);

            return {
                success: false
            };
        }
    };

    return (
        <VRChatContext.Provider
        value={{
            authUser,
            verify2fa,
            getUserInfo,
            switchAvatar,
            logout
        }}
        >
            {children}
        </VRChatContext.Provider>
    );
};

export function useVRChat() {
    const context = useContext(VRChatContext);
  
    if (!context) throw new Error('useVRChat must be used within a VRChatProvider');
    
    return context;
};