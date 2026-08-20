import { CurrentUser, RequiresTwoFactorAuth, VRChat as VRC } from 'vrchat';
import { EventEmitter } from 'events';
import { KeyvFile } from 'keyv-file';
import { app } from 'electron';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import Discord from './DiscordRPC';

export type AuthState = 'idle' | 'authenticating' | 'needs_2fa' | 'authenticated' | 'error';

export interface AuthStatus {
    state: AuthState;
    error: string | null;
}

interface VRChatCookie {
    name: string;
    value: string;
}

interface VRChatClientInternal {
    getCookies(): Promise<VRChatCookie[]>;
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

const PIPELINE_HEARTBEAT_INTERVAL_MS = 30_000;

class VRChat extends EventEmitter {
    private static instance: VRChat;

    private vrchat: VRC;

    private authState: AuthState = 'idle';

    private authError: string | null = null;

    private pending2FA: Deferred<string> | null = null;

    private userId: string | null = null;

    private pipelineAuthToken: string | null = null;

    private pipelineHeartbeat: ReturnType<typeof setInterval> | null = null;

    private currentAvatar: any = {
        id: null,
        name: null,
        imageUrl: null,
        thumbnailImageUrl: null,
        authorName: null
    };

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

        // @ts-ignore
        this.vrchat.pipeline.on('user-update', async (content: any): void => {
            if (content.userId !== this.userId) return;
            if (content.currentAvatar === this.currentAvatar.id) return;

            const currentAvatar: any = await this.getOwnAvatar();

            if (currentAvatar) {
                this.currentAvatar.id = currentAvatar.id;
                this.currentAvatar.name = currentAvatar.name;
                this.currentAvatar.imageUrl = currentAvatar.imageUrl;
                this.currentAvatar.thumbnailImageUrl = currentAvatar.thumbnailImageUrl;
                this.currentAvatar.authorName = currentAvatar.authorName;
            }

            await Discord.setActivity({});
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

    public get pipeline(): VRC['pipeline'] {
        return this.vrchat.pipeline;
    };

    private async getAuthCookieValue(): Promise<string | null> {
        const cookies: VRChatCookie[] = await (this.vrchat as unknown as VRChatClientInternal).getCookies();

        return cookies.find((cookie: VRChatCookie): boolean => cookie.name === 'auth')?.value ?? null;
    };

    private async connectPipeline(): Promise<void> {
        const authToken: string | null = await this.getAuthCookieValue();

        if (!authToken) return;

        this.pipelineAuthToken = authToken;

        await this.vrchat.pipeline.authenticate(authToken);
        this.startPipelineHeartbeat();
    };

    private startPipelineHeartbeat(): void {
        if (this.pipelineHeartbeat) return;

        this.pipelineHeartbeat = setInterval((): void => {
            if (this.authState !== 'authenticated') return;
            if (this.vrchat.pipeline.connected) return;
            if (!this.pipelineAuthToken) return;

            this.vrchat.pipeline.authenticate(this.pipelineAuthToken).catch((error: unknown): void => {
                console.error('Failed to reconnect VRChat pipeline:', error);
            });
        }, PIPELINE_HEARTBEAT_INTERVAL_MS);
    };

    private stopPipelineHeartbeat(): void {
        if (!this.pipelineHeartbeat) return;

        clearInterval(this.pipelineHeartbeat);

        this.pipelineHeartbeat = null;
    };

    public async initialize(): Promise<boolean> {
        try {
            const response: any = await this.vrchat.getCurrentUser();

            const data: any = response?.data;

            if (data && !data.error && !('requiresTwoFactorAuth' in data)) {
                this.userId = data.id;

                this.setState('authenticated');
                await this.connectPipeline();

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
            await this.connectPipeline();
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
        this.stopPipelineHeartbeat();
        this.vrchat.pipeline.close();

        this.pipelineAuthToken = null;

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

    public async getOwnAvatar(): Promise<any> {
        if (this.authState !== 'authenticated') return null;
        if (!this.userId) return null;

        const response: any = await this.vrchat.getOwnAvatar({
            path: {
                userId: this.userId
            }
        });

        return response.data;
    };

    public async getCurrentAvatar(): Promise<any> {
        if (!this.currentAvatar.id) {
            const currentAvatar: any = await this.getOwnAvatar();

            if (currentAvatar) {
                this.currentAvatar.id = currentAvatar.id;
                this.currentAvatar.name = currentAvatar.name;
                this.currentAvatar.imageUrl = currentAvatar.imageUrl;
                this.currentAvatar.thumbnailImageUrl = currentAvatar.thumbnailImageUrl;
                this.currentAvatar.authorName = currentAvatar.authorName;
            }
        }

        return this.currentAvatar;
    };
}

export default VRChat.getInstance();