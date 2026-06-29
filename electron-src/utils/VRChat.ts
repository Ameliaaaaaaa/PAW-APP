import { CurrentUser, RequiresTwoFactorAuth, VRChat as VRC } from 'vrchat';
import { EventEmitter } from 'events';
import { KeyvFile } from 'keyv-file';
import { app } from 'electron';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export type AuthState = 'idle' | 'authenticating' | 'needs_2fa' | 'authenticated' | 'error';

export interface AuthStatus {
    state: AuthState;
    error: string | null;
}

interface Deferred<T> {
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
    promise: Promise<T>;
}

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res: any, rej: any): void => {
        resolve = res;
        reject = rej;
    });

    return {
        resolve,
        reject,
        promise
    };
}

class VRChat extends EventEmitter {
    private static instance: VRChat;

    private vrchat: VRC;

    private authState: AuthState = 'idle';

    private authError: string | null = null;

    private pending2FA: Deferred<string> | null = null;

    private constructor() {
        super();

        const pawDir: string = path.join(os.homedir(), 'Documents', 'PAW');

        if (!fs.existsSync(pawDir)) fs.mkdirSync(pawDir, {
            recursive: true
        });

        this.vrchat = new VRC({
            application: {
                name: 'PAW',
                version: app.getVersion(),
                contact: 'me@amelia.fun'
            },
            keyv: new KeyvFile({
                filename: path.join(pawDir, 'auth.json')
            })
        });
    };

    public static getInstance(): VRChat {
        if (!VRChat.instance) VRChat.instance = new VRChat();

        return VRChat.instance;
    };

    private setState(state: AuthState, error?: string): void {
        this.authState = state;
        this.authError = error ?? null;

        this.emit('authStateChange', this.getAuthStatus());
    };

    public getAuthStatus(): AuthStatus {
        return {
            state: this.authState,
            error: this.authError
        };
    };

    public async initialize(): Promise<boolean> {
        try {
            const response: any = await this.vrchat.getCurrentUser();

            const data: any = response?.data;

            if (data && !data.error && !('requiresTwoFactorAuth' in data)) {
                this.setState('authenticated');

                return true;
            }
        } catch {}

        this.setState('idle');

        return false;
    };

    public async login(username: string, password: string): Promise<void> {
        this.setState('authenticating');

        this.pending2FA = createDeferred<string>();

        try {
            await this.vrchat.login({
                username,
                password,
                twoFactorCode: async (): Promise<string> => {
                    this.setState('needs_2fa');

                    const code: string = await this.pending2FA!.promise;

                    this.setState('authenticating');

                    return code;
                },
                throwOnError: true
            });

            this.pending2FA = null;

            this.setState('authenticated');
        } catch (error) {
            this.pending2FA?.reject(error);

            this.pending2FA = null;

            const message: any = error instanceof Error ? error.message : 'Login failed';

            this.setState('error', message);

            throw error;
        }
    };

    public submitTwoFactor(code: string): void {
        if (!this.pending2FA) throw new Error('No 2FA request is pending.');

        this.pending2FA.resolve(code);
    };

    public cancelLogin(): void {
        this.pending2FA?.reject(new Error('Login cancelled.'));

        this.pending2FA = null;

        this.setState('idle');
    };

    public async logout(): Promise<void> {
        await this.vrchat.logout();

        this.setState('idle');
    };

    public async fetchUserInfo(): Promise<CurrentUser | RequiresTwoFactorAuth | undefined> {
        const response: any = await this.vrchat.getCurrentUser();

        return response.data;
    };

    public async switchAvatar(avatarId: string): Promise<void> {
        await this.vrchat.selectAvatar({
            path: {
                avatarId
            },
            throwOnError: true
        });
    };

    public async getAvatar(avatarId: string): Promise<string> {
        const response: any = await this.vrchat.getAvatar({
            path: {
                avatarId
            }
        });

        return response.data;
    };
}

export default VRChat.getInstance();