import Timeout = NodeJS.Timeout;
import * as path from 'path';
import * as fs from 'fs';

import Database from './Database';
import PAW from './PAW';

const AMP_PATH = '%Temp%\\VRChat\\VRChat\\amplitude.cache';
const LOW_PATH = '%AppData%\\..\\LocalLow\\VRChat\\VRChat';

const AVATAR_ID_RE = /avtr_\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/g;

const AMP_POLL_MS = 100;
const LOG_POLL_MS = 500;

class LogScanner {
    private static instance: LogScanner;

    private vrchatAmpPath: string | undefined;
    private vrchatLowPath: string | undefined;
    private watchedLogPath: string | null = null;

    private lastFileSize: number = 0;

    private stopWatcher: (() => void) | null = null;
    private stopAmpWatcher: (() => void) | null = null;

    private seenAmpIds: Set<string> = new Set<string>();

    private constructor() {};

    public static getInstance(): LogScanner {
        if (!LogScanner.instance) LogScanner.instance = new LogScanner();

        return LogScanner.instance;
    };

    public async initialize(): Promise<void> {
        this.getVrchatAmpPath();
        this.getVrchatLowPath();

        if (!this.vrchatAmpPath || !this.vrchatLowPath) return;

        this.watchedLogPath = this.getLatestLogFile();

        if (!this.watchedLogPath) return;

        await this.scanRange(0);
        await this.startWatching();
        this.startAmpWatching();
    };

    private parsePathEnv(rawPath: string): string {
        const resolved: string = rawPath.replace(/(?:\$|%)(\w+)%?/g, (_: any, envVar: string): string => {
            const value: string | undefined = process.env[envVar];

            if (value === undefined) throw new Error(`Environment variable not found: ${envVar}`);

            return value;
        });

        const normalised: string = path.normalize(resolved);

        return fs.realpathSync(normalised);
    };

    private getVrchatAmpPath(): string | undefined {
        if (!this.vrchatAmpPath) this.vrchatAmpPath = this.parsePathEnv(AMP_PATH);

        return this.vrchatAmpPath;
    };

    private getVrchatLowPath(): string | undefined {
        if (!this.vrchatLowPath) this.vrchatLowPath = this.parsePathEnv(LOW_PATH);

        return <string>this.vrchatLowPath;
    };

    private getLatestLogFile(): string | null {
        let latest: { name: string; mtime: number } | null = null;

        try {
            // @ts-ignore
            for (const entry of fs.readdirSync(this.vrchatLowPath)) {
                if (!entry.startsWith('output_log_') || !entry.endsWith('.txt')) continue;

                // @ts-ignore
                const full: string = path.join(this.vrchatLowPath, entry);

                try {
                    const { mtimeMs } = fs.statSync(full);

                    if (!latest || mtimeMs > latest.mtime) latest = {
                        name: full,
                        mtime: mtimeMs
                    };
                } catch {}
            }
        } catch {
            return null;
        }

        return latest?.name ?? null;
    };

    public stop(): void {
        this.stopWatcher?.();
        this.stopAmpWatcher?.();

        this.stopWatcher = null;
        this.stopAmpWatcher = null;
    };

    private async startWatching(): Promise<void> {
        const interval: Timeout = setInterval(async (): Promise<void> => {
            if (!this.watchedLogPath) return;

            try {
                const { size } = fs.statSync(this.watchedLogPath);

                if (size > this.lastFileSize) {
                    await this.scanRange(this.lastFileSize);

                    this.lastFileSize = size;
                }
            } catch {
                const latest: string | null = this.getLatestLogFile();

                if (latest && latest !== this.watchedLogPath) {
                    this.watchedLogPath = latest;
                    this.lastFileSize = 0;

                    await this.scanRange(0);

                    this.lastFileSize = fs.statSync(this.watchedLogPath).size;
                }
            }
        }, LOG_POLL_MS);

        this.stopWatcher = (): void => clearInterval(interval);
    };

    private startAmpWatching(): void {
        const interval: Timeout = setInterval(async (): Promise<void> => {
            if (!this.vrchatAmpPath) return;

            let fd: number | null = null;

            try {
                fd = fs.openSync(this.vrchatAmpPath, 'r');

                const { size } = fs.fstatSync(fd);

                if (size <= 0) return;

                const buf: Buffer = Buffer.alloc(size);

                fs.readSync(fd, buf, 0, size, 0);

                const text: string = buf.toString('latin1');

                const newIds: string[] = [];

                // @ts-ignore
                for (const match of text.matchAll(AVATAR_ID_RE)) {
                    const id: string = match[0];

                    if (!this.seenAmpIds.has(id)) {
                        this.seenAmpIds.add(id);
                        newIds.push(id);
                    }
                }

                for (const id of newIds) {
                    await this.handleAvatarId(id);
                }
            } catch {} finally {
                if (fd !== null) try { fs.closeSync(fd); } catch {}
            }
        }, AMP_POLL_MS);

        this.stopAmpWatcher = (): void => clearInterval(interval);
    };

    private async scanRange(from: number): Promise<void> {
        let fd: number | null = null;

        try {
            fd = fs.openSync(this.watchedLogPath!, 'r');

            const { size } = fs.fstatSync(fd);
            const length: number = size - from;

            if (length <= 0) return;

            const buf: Buffer = Buffer.alloc(length);
            const bytesRead: number = fs.readSync(fd, buf, 0, length, from);
            const text: string = buf.subarray(0, bytesRead).toString('utf-8');

            const seen = new Set<string>();

            // @ts-ignore
            for (const match of text.matchAll(AVATAR_ID_RE)) {
                const id: any = match[0];

                if (!seen.has(id)) {
                    seen.add(id);
                    await this.handleAvatarId(id);
                }
            }

            this.lastFileSize = from + bytesRead;
        } catch {} finally {
            if (fd !== null) fs.closeSync(fd);
        }
    };

    private async handleAvatarId(avatarId: string): Promise<void> {
        await PAW.refreshAvatar(avatarId);
        await Database.markSeen(avatarId);
    };
}

export default LogScanner.getInstance();