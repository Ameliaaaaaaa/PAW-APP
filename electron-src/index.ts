if (typeof (Promise as any).withResolvers === 'undefined') {
    (Promise as any).withResolvers = function <T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!:  (reason?: unknown) => void;

        const promise = new Promise<T>((res: any, rej: any): void => {
            resolve = res;
            reject  = rej;
        });

        return {
            promise,
            resolve,
            reject
        };
    };
}

import { BrowserWindow, app, ipcMain, IpcMainInvokeEvent, IpcMainEvent, shell, nativeTheme } from 'electron';
import { CurrentUser, RequiresTwoFactorAuth } from 'vrchat';
import prepareNext from 'electron-next';
import isDev from 'electron-is-dev';
import { format } from 'url';
import { join } from 'path';
import * as os from 'os';

import VRChat, { AuthStatus } from './utils/VRChat';
import DiscordRPC from './utils/DiscordRPC';
import LogScanner from './utils/LogScanner';
import Migration from './utils/Migration';
import Database from './utils/Database';

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('in-process-gpu');

app.on('ready', async (): Promise<void> => {
    await prepareNext('./renderer');

    nativeTheme.themeSource = 'system';

    const splash = new BrowserWindow({
        width: 500,
        height: 300,
        frame: false,
        transparent: false,
        alwaysOnTop: true,
        backgroundColor: nativeTheme.shouldUseDarkColors ? '#0d0c10' : '#faf7f9',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: join(__dirname, 'preload.js')
        }
    });

    await splash.loadFile(join(__dirname, '../build/splash.html'));

    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        show: false,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: join(__dirname, 'preload.js')
        },
        icon: join(__dirname, '../build/icon.png')
    });

    mainWindow.setMenu(null);

    const url: string = isDev ? 'http://localhost:8000/' : format({
        pathname: join(__dirname, '../renderer/out/index.html'),
        protocol: 'file:',
        slashes: true
    });

    mainWindow.on('close', (event: Electron.Event): void => {
        if (Migration.isMigrating()) event.preventDefault();
    });

    mainWindow.on('minimize', (event: Electron.Event): void => {
        if (Migration.isMigrating()) event.preventDefault();
    });

    Migration.on('status', (status: any): void => {
        BrowserWindow.getAllWindows().forEach((window: BrowserWindow): void => window.webContents.send('migration:status', status));
    });

    await VRChat.initialize();
    await Database.initialize();
    await LogScanner.initialize();
    Migration.handleMigration();

    await mainWindow.loadURL(url);

    splash.close();
    mainWindow.show();
});

app.on('window-all-closed', app.quit);

VRChat.on('authStateChange', (status: any): void => {
    BrowserWindow.getAllWindows().forEach((window: BrowserWindow): void => window.webContents.send('vrchat:authStateChange', status));
});

nativeTheme.on('updated', (): void => {
    BrowserWindow.getAllWindows().forEach((window: BrowserWindow): void => {
        window.webContents.send('theme:updated', nativeTheme.shouldUseDarkColors);
    });
});

ipcMain.handle('theme:is-dark', (): boolean => {
    return nativeTheme.shouldUseDarkColors;
});

ipcMain.handle('get-app-version', (): string => {
    return app.getVersion();
});

ipcMain.handle('get-electron-version', (): string => {
    return process.versions.electron;
});

ipcMain.handle('open-storeData', async (_: IpcMainInvokeEvent): Promise<void> => {
    const pawDir: string = join(os.homedir(), 'Documents', 'PAW');

    await shell.openPath(pawDir);
});

ipcMain.handle('open-userData', async (_: IpcMainInvokeEvent): Promise<void> => {
    await shell.openPath(app.getPath('userData'));
});

ipcMain.handle('open-installPath', async (_: IpcMainInvokeEvent): Promise<void> => {
    // @ts-ignore
    const installPath: string = join(process.env.LOCALAPPDATA, 'Programs', 'PAW');

    await shell.openPath(installPath);
});

ipcMain.handle('open-external', async (_: IpcMainInvokeEvent, url: string): Promise<void> => {
    await shell.openExternal(url);
});

ipcMain.handle('migration:getStatus', (): { migrating: boolean } => ({
    migrating: Migration.isMigrating()
}));

ipcMain.handle('discord:setEnabled', (_event: IpcMainInvokeEvent, value: boolean): void => {
    DiscordRPC.setEnabled(value);
});

ipcMain.handle('discord:getEnabled', (): boolean => {
    return DiscordRPC.getEnabled();
});

ipcMain.on('discord:setActivity', (_event: IpcMainEvent, { imageUrl, imageText, state }: { imageUrl?: string, imageText?: string, state: string }): void => {
    DiscordRPC.setActivity({
        imageUrl,
        imageText,
        state
    });
});

ipcMain.handle('vrchat:initialize', (): Promise<boolean> => VRChat.initialize());
ipcMain.handle('vrchat:getAuthStatus', (): AuthStatus => VRChat.getAuthStatus());
ipcMain.handle('vrchat:login', (_: IpcMainInvokeEvent, username: string, password: string): Promise<void> => VRChat.login(username, password));
ipcMain.handle('vrchat:submitTwoFactor', (_: IpcMainInvokeEvent, code: string): void => VRChat.submitTwoFactor(code));
ipcMain.handle('vrchat:cancelLogin', (): void => VRChat.cancelLogin());
ipcMain.handle('vrchat:logout', (): Promise<void> => VRChat.logout());
ipcMain.handle('vrchat:fetchUserInfo', (): Promise<CurrentUser | RequiresTwoFactorAuth | undefined> => VRChat.fetchUserInfo());
ipcMain.handle('vrchat:switchAvatar', (_: IpcMainInvokeEvent, id: string): Promise<void> => VRChat.switchAvatar(id));
ipcMain.handle('vrchat:getAvatar', (_: IpcMainInvokeEvent, id: string): Promise<string> => VRChat.getAvatar(id));