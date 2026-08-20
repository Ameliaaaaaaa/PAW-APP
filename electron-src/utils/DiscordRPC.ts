// @ts-ignore
import RPC from 'discord-rpc';

import VRChat from './VRChat';

class DiscordRPC {
    private static instance: DiscordRPC;

    private rpc: any;

    private enabled: boolean = false;

    private currentDetails: string = 'Loading...';

    private constructor() {};

    public static getInstance(): DiscordRPC {
        if (!DiscordRPC.instance) DiscordRPC.instance = new DiscordRPC();

        return DiscordRPC.instance;
    };

    public initialize(): void {
        this.rpc = new RPC.Client({
            transport: 'ipc'
        });

        this.rpc.on('ready', (): void => {
            this.setActivity({
                details: this.currentDetails
            });
        });

        this.rpc.login({
            clientId: '1332064258590249092'
        });
    };

    public setEnabled(value: boolean): void {
        this.enabled = value;

        if (!value) {
            this.rpc?.clearActivity?.();
        } else {
            if (!this.rpc) {
                this.initialize();
            } else {
                this.setActivity({
                    details: this.currentDetails
                });
            }
        }
    };

    public getEnabled(): boolean {
        return this.enabled;
    };

    public async setActivity({ details }: { details?: string }): Promise<void> {
        if (!this.enabled) return;

        if (details) this.currentDetails = details;

        const currentAvatar: any = await VRChat.getCurrentAvatar();
        const hasAvatar: boolean = Boolean(currentAvatar?.id);

        this.rpc.setActivity({
            details: this.currentDetails,
            ...(hasAvatar && {
                largeImageKey: currentAvatar.imageUrl ? currentAvatar.imageUrl : currentAvatar.thumbnailImageUrl,
                largeImageText: `${currentAvatar.name} - ${currentAvatar.authorName}`,
                state: `Avatar: ${currentAvatar.name} - ${currentAvatar.authorName}`
            }),
            startTimestamp: new Date(),
            instance: false
        });
    };
}

export default DiscordRPC.getInstance();