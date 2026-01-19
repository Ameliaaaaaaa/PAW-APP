'use client';

import { getTauriVersion } from '@tauri-apps/api/app';
import { Info, ExternalLink } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-shell';
import { useState, useEffect } from 'react';

import { useLanguage } from '@/context/language-provider-context';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Page() {
    const [appVersion, setAppVersion] = useState('Loading...');
    const [tauriVersion, setTauriVersion] = useState('Loading...');

    const { lang } = useLanguage();

    useEffect(() => {
        loadVersionInfo();
    }, []);

    const loadVersionInfo = async () => {
        try {
            setAppVersion(await getVersion());
            setTauriVersion(await getTauriVersion());
        } catch (error) {
            setAppVersion(lang.About.Unknown);
            setTauriVersion(lang.About.Unknown);
        }
    };

    return (
        <div>
            <UpdateTitle/>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center gap-3 mb-8">
                    <Info className="h-8 w-8"/>
                    <h1 className="text-4xl font-bold">{lang.About.Header}</h1>
                </div>

                <Card className="mb-6">
                    <CardHeader className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm font-medium">{lang.About.ApplicationVersion}</span>
                                <span className="text-sm text-muted-foreground">{appVersion}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm font-medium">{lang.About.TauriVersion}</span>
                                <span className="text-sm text-muted-foreground">{tauriVersion}</span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full md:w-auto" onClick={() => open('https://github.com/Ameliaaaaaaa/PAW-APP')}>
                            <ExternalLink className="h-4 w-4 mr-2"/>
                            {lang.About.GitHub}
                        </Button>
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
            tauri.getCurrentWindow().setTitle(lang.About.Title);
        });
    } catch (error) {
    }

    return null;
};