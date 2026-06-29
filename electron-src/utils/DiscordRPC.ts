// @ts-ignore
import RPC from 'discord-rpc';

class DiscordRPC {
    private static instance: DiscordRPC;

    private rpc: any;

    private enabled: boolean = false;

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
                state: 'Loading...'
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
                    state: 'Loading...'
                });
            }
        }
    };

    public getEnabled(): boolean {
        return this.enabled;
    };

    public setActivity({ imageUrl, imageText, state }: { imageUrl?: string, imageText?: string, state: string }): void {
        if (!this.enabled) return;

        this.rpc.setActivity({
            details: 'Using PAW',
            ...(imageUrl && {
                largeImageKey: imageUrl,
                largeImageText: imageText
            }),
            state: state,
            startTimestamp: new Date(),
            instance: false
        });
    };
}

export default DiscordRPC.getInstance();