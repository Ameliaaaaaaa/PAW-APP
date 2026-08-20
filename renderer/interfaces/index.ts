import Database from "../../electron-src/utils/Database";

declare global {
    interface Window {
        electron: {
            getAppVersion(): Promise<string>;
            getElectronVersion(): Promise<string>;
            openStoreData(): Promise<void>;
            openUserData(): Promise<void>;
            openInstallData(): Promise<void>;
            openExternal(url: string): Promise<any>;
            Migration: {
                getStatus(): Promise<{ migrating: boolean }>;
                onStatusChange(cb: (status: any) => void): () => void;
            };
            Database: {
                createCategory(name: string): Promise<void>;
                getCategories(): Promise<any[]>;
                updateCategory(categoryId: number, newName: string): Promise<void>;
                deleteCategory(categoryId: number): Promise<void>;
                getFavorites(categoryId: number): Promise<any[]>;
                checkFavorite(avatarId: string): Promise<any>;
                favoriteAvatar(categoryId: number, avatarId: string): Promise<{ success: boolean; exists?: boolean; error?: string }>;
                unfavoriteAvatar(favoriteId: number): Promise<void>;
                removeFromFavorites(avatarId: string): Promise<void>;
                getSeenAvatars(orderBy: string): Promise<{ avatar_id: string; first_seen: string; last_seen: string }[]>;
            },
            PAW: {
                fetchLatestVersion(): Promise<any>;
                fetchStats(): Promise<any>;
                searchAvatars(type: string, query: string, platforms: string, page: number, orderBy: string, ratingParams?: Record<string, string>): Promise<any>;
                findSimilar(avatarId: string): Promise<any>;
                refreshAvatar(avatarId: string): Promise<any>;
                fetchAvatar(avatarId: string): Promise<any>;
                fetchRandomAvatars(): Promise<any>;
                fetchDonators(): Promise<any>;
                fetchRecentAvatars(orderBy: string): Promise<any>;
            };
            VRChat: {
                getAuthStatus(): any;
                initialize(): Promise<boolean>;
                login(username: string, password: string): Promise<any>;
                submitTwoFactor(code: string): Promise<any>;
                cancelLogin(): any;
                logout(): Promise<void>;
                fetchUserInfo(): Promise<any>;
                switchAvatar(id: string): Promise<any>;
                getAvatar(id: string): Promise<any>;
                onAuthStateChange(status: any): any;
            },
            DiscordRPC: {
                setActivity({ details }: { details?: string }): void;
                setEnabled(value: boolean): Promise<void>;
                getEnabled(): Promise<boolean>;
            }
        };
    }
}

export {};