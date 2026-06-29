import { ipcRenderer } from 'electron';

const BASE_URL = 'https://paw-api.amelia.fun';

let CURRENT_VERSION: string | null = null;

class PAW {
    private static instance: PAW;

    private constructor() {};

    public static getInstance(): PAW {
        if (!PAW.instance) PAW.instance = new PAW();

        return PAW.instance;
    };

    public async fetchLatestVersion(): Promise<any> {
        try {
            if (!CURRENT_VERSION) CURRENT_VERSION = await ipcRenderer.invoke('get-app-version');

            const response: Response = await fetch('https://api.github.com/repos/Ameliaaaaaaa/PAW-APP/releases/latest', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${CURRENT_VERSION}`
                }
            });

            return {
                success: response.ok,
                version: response.ok ? (await response.json()).name : '0.0.0'
            };
        } catch (error) {
            return {
                success: false
            };
        }
    };

    public async fetchStats(): Promise<any> {
        try {
            if (!CURRENT_VERSION) CURRENT_VERSION = await ipcRenderer.invoke('get-app-version');

            const response: Response = await fetch(BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${CURRENT_VERSION}`
                }
            });

            return {
                success: response.ok,
                stats: response.ok ? (await response.json()).stats : null
            };
        } catch (error) {
            return {
                success: false
            };
        }
    };

    public async searchAvatars(type: string, query: string, platforms: string, pageRef: any, orderBy: string, ratingParams: Record<string, string> = {}): Promise<any> {
        try {
            if (!CURRENT_VERSION) CURRENT_VERSION = await ipcRenderer.invoke('get-app-version');

            const response: Response = await fetch(`${BASE_URL}/search?${new URLSearchParams({
                type: type,
                query: query,
                platforms: platforms,
                page: pageRef.current.toString(),
                order: orderBy,
                ...ratingParams
            })}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${CURRENT_VERSION}`
                }
            });

            return {
                success: response.ok,
                data: response.ok ? await response.json() : null
            };
        } catch (error) {
            return {
                success: false
            };
        }
    };

    public async findSimilar(avatarId: string): Promise<any> {
        try {
            if (!CURRENT_VERSION) CURRENT_VERSION = await ipcRenderer.invoke('get-app-version');

            const response: Response = await fetch(`${BASE_URL}/similar?${new URLSearchParams({
                avatar_id: avatarId
            })}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${CURRENT_VERSION}`
                }
            });

            return {
                success: response.ok,
                data: response.ok ? await response.json() : null
            };
        } catch (error) {
            return {
                success: false
            };
        }
    };

    public async refreshAvatar(avatarId: string): Promise<any> {
        try {
            if (!CURRENT_VERSION) CURRENT_VERSION = await ipcRenderer.invoke('get-app-version');

            const response: Response = await fetch(`${BASE_URL}/update?avatarId=${avatarId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${CURRENT_VERSION}`
                }
            });

            return {
                success: response.ok
            };
        } catch (error) {
            return {
                success: false
            };
        }
    };

    public async fetchAvatar(avatarId: string): Promise<any> {
        try {
            if (!CURRENT_VERSION) CURRENT_VERSION = await ipcRenderer.invoke('get-app-version');

            const response = await fetch(`${BASE_URL}/avatar?avatarId=${avatarId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${CURRENT_VERSION}`
                }
            });

            return {
                success: response.ok,
                result: response.ok ? (await response.json()).result : null
            };
        } catch (error) {
            return {
                success: false
            };
        }
    };

    public async fetchRandomAvatars(): Promise<any> {
        try {
            if (!CURRENT_VERSION) CURRENT_VERSION = await ipcRenderer.invoke('get-app-version');

            const response: Response = await fetch(`${BASE_URL}/random`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${CURRENT_VERSION}`
                }
            });

            return {
                success: response.ok,
                results: response.ok ? (await response.json()).results : []
            };
        } catch (error) {
            return {
                success: false
            };
        }
    };

    public async fetchRecentAvatars(orderBy: string): Promise<any> {
        try {
            if (!CURRENT_VERSION) CURRENT_VERSION = await ipcRenderer.invoke('get-app-version');

            const response: Response = await fetch(`${BASE_URL}/recent/${orderBy}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${CURRENT_VERSION}`
                }
            });

            return {
                success: response.ok,
                results: response.ok ? (await response.json()).results : []
            };
        } catch (error) {
            return {
                success: false
            };
        }
    };
}

export default PAW.getInstance();