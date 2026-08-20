import { contextBridge, ipcRenderer, IpcRendererEvent, IpcRenderer } from 'electron';

import Database from './utils/Database';
import PAW from './utils/PAW';

contextBridge.exposeInMainWorld('electron', {
    isDark: (): Promise<boolean> => ipcRenderer.invoke('theme:is-dark'),
    onChange: (callback: (isDark: boolean) => void): void => {
        ipcRenderer.on('theme:updated', (_event: IpcRendererEvent, isDark: any): void => callback(isDark));
    },
    getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
    getElectronVersion: (): Promise<string> => ipcRenderer.invoke('get-electron-version'),
    openStoreData: (): Promise<void> => ipcRenderer.invoke('open-storeData'),
    openUserData: (): Promise<void> => ipcRenderer.invoke('open-userData'),
    openInstallData: (): Promise<void> => ipcRenderer.invoke('open-installPath'),
    openExternal: (url: string): Promise<any> => ipcRenderer.invoke('open-external', url),
    Migration: {
        getStatus: (): Promise<{ migrating: boolean }> => ipcRenderer.invoke('migration:getStatus'),
        onStatusChange: (cb: any): () => IpcRenderer => {
            ipcRenderer.on('migration:status', (_: IpcRendererEvent, status: any): any => cb(status));

            return (): IpcRenderer => ipcRenderer.removeAllListeners('migration:status');
        }
    },
    Database: {
        createCategory: (name: string): Promise<void> => Database.createCategory(name),
        getCategories: (): Promise<any[]> => Database.getCategories(),
        updateCategory: (categoryId: number, newName: string): Promise<void> => Database.updateCategory(categoryId, newName),
        deleteCategory: (categoryId: number): Promise<void> => Database.deleteCategory(categoryId),
        getFavorites: (categoryId: number): Promise<any[]> => Database.getFavorites(categoryId),
        checkFavorite: (avatarId: string): Promise<any> => Database.checkFavorite(avatarId),
        favoriteAvatar: (categoryId: number, avatarId: string): Promise<{ success: boolean; exists?: boolean; error?: string }> => Database.favoriteAvatar(categoryId, avatarId),
        unfavoriteAvatar: (favoriteId: number): Promise<void> => Database.unfavoriteAvatar(favoriteId),
        removeFromFavorites: (avatarId: string): Promise<void> => Database.removeFromFavorites(avatarId),
        getSeenAvatars: (orderBy: 'last_seen' | 'first_seen' = 'last_seen'): Promise<{ avatar_id: string; first_seen: string; last_seen: string }[]> => Database.getSeenAvatars(orderBy)
    },
    PAW: {
        fetchLatestVersion: (): Promise<any> => PAW.fetchLatestVersion(),
        fetchStats: (): Promise<any> => PAW.fetchStats(),
        searchAvatars: (type: string, query: string, platforms: string, pageRef: any, orderBy: string, ratingParams?: Record<string, string>): Promise<any> => PAW.searchAvatars(type, query, platforms, pageRef, orderBy, ratingParams),
        findSimilar: (avatarId: string): Promise<any> => PAW.findSimilar(avatarId),
        refreshAvatar: (avatarId: string): Promise<any> => PAW.refreshAvatar(avatarId),
        fetchAvatar: (avatarId: string): Promise<any> => PAW.fetchAvatar(avatarId),
        fetchDonators: (): Promise<any> => PAW.fetchDonators(),
        fetchRandomAvatars: (): Promise<any> => PAW.fetchRandomAvatars(),
        fetchRecentAvatars: (orderBy: string): Promise<any> => PAW.fetchRecentAvatars(orderBy)
    },
    VRChat: {
        getAuthStatus: (): any => ipcRenderer.invoke('vrchat:getAuthStatus'),
        initialize: (): Promise<boolean> => ipcRenderer.invoke('vrchat:initialize'),
        login: (username: string, password: string): Promise<any> => ipcRenderer.invoke('vrchat:login', username, password),
        submitTwoFactor: (code: string): Promise<any> => ipcRenderer.invoke('vrchat:submitTwoFactor', code),
        cancelLogin: (): any => ipcRenderer.invoke('vrchat:cancelLogin'),
        logout: (): Promise<void> => ipcRenderer.invoke('vrchat:logout'),
        fetchUserInfo: (): Promise<any> => ipcRenderer.invoke('vrchat:fetchUserInfo'),
        switchAvatar: (id: string): Promise<any> => ipcRenderer.invoke('vrchat:switchAvatar', id),
        getAvatar: (id: string): Promise<any> => ipcRenderer.invoke('vrchat:getAvatar', id),
        onAuthStateChange: (cb: any): () => IpcRenderer => {
            ipcRenderer.on('vrchat:authStateChange', (_: IpcRendererEvent, status: any): any => cb(status));

            return (): IpcRenderer => ipcRenderer.removeAllListeners('vrchat:authStateChange');
        }
    },
    DiscordRPC: {
        setActivity: ({ details }: { details?: string }): void => {
            ipcRenderer.send('discord:setActivity', { details });
        },
        setEnabled: (value: boolean): Promise<void> => ipcRenderer.invoke('discord:setEnabled', value),
        getEnabled: (): Promise<boolean> => ipcRenderer.invoke('discord:getEnabled')
    }
});