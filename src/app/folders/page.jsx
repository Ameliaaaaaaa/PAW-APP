'use client';

import { File, FileText, Database, Folder } from 'lucide-react';
import { remove, BaseDirectory } from '@tauri-apps/plugin-fs';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { openPath } from '@tauri-apps/plugin-opener';
import { message } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import * as path from '@tauri-apps/api/path';

import { useLanguage } from '@/context/language-provider-context';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Page() {
    const { lang } = useLanguage();

    const openFolder = async (type) => {
        if (type === 'logs') await openPath(`${await path.appLocalDataDir()}\\logs`);
        if (type === 'data') await openPath(await path.appDataDir());
        if (type === 'cache') await openPath(await path.appLocalDataDir());
    };

    const clearCache = async () => {
        await getCurrentWebview().clearAllBrowsingData();

        try {
            await remove('store.json', {
                baseDir: BaseDirectory.AppData
            });
        } catch (error) {}

        try {
            await remove('.cookies', {
                baseDir: BaseDirectory.AppLocalData
            });
        } catch (error) {}

        await message(lang.Folders.ClosePAW.Message, { title: lang.Folders.ClosePAW.Title, kind: 'info' });
        await invoke('close_app');
    };

    return (
        <div>
            <UpdateTitle/>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center gap-3 mb-8">
                    <File className="h-8 w-8"/>
                    <h1 className="text-4xl font-bold">{lang.Folders.Header}</h1>
                </div>

                <Card className="mb-6">
                    <CardHeader className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="justify-start"
                                onClick={() => openFolder('logs')}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                {lang.Folders.LogsFolder}
                            </Button>

                            <Button
                                variant="outline"
                                className="justify-start"
                                onClick={() => openFolder('data')}
                            >
                                <Database className="h-4 w-4 mr-2" />
                                {lang.Folders.AppDataFolder}
                            </Button>

                            <Button
                                variant="outline"
                                className="justify-start"
                                onClick={() => openFolder('cache')}
                            >
                                <Folder className="h-4 w-4 mr-2" />
                                {lang.Folders.CacheFolder}
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="mb-6">
                    <CardHeader className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="justify-start"
                                onClick={() => clearCache()}
                            >
                                <Folder className="h-4 w-4 mr-2" />
                                {lang.Folders.ClearCache}
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}

const UpdateTitle = () => {
    try {
        if (typeof window === 'undefined') return null;

        const { lang } = useLanguage();

        import('@tauri-apps/api/window').then((tauri) => {
            tauri.getCurrentWindow().setTitle(lang.Folders.Title);
        });
    } catch (error) {
    }

    return null;
};