'use client';

import { Info, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Page(): JSX.Element {
    const [appVersion, setAppVersion] = useState('Loading...');
    const [electronVersion, setElectronVersion] = useState('Loading...');

    useEffect((): void => {
        const getVersions: () => Promise<void> = async (): Promise<void> => {
            const app: string = await window.electron.getAppVersion();
            const electron: string = await window.electron.getElectronVersion();

            setAppVersion(app);
            setElectronVersion(electron);
        };

        getVersions();
    }, []);

    return (
        <div>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center gap-3 mb-8">
                    <Info className="h-8 w-8"/>
                    <h1 className="text-4xl font-bold">About PAW</h1>
                </div>

                <Card className="mb-6">
                    <CardHeader className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm font-medium">Application Version</span>
                                <span className="text-sm text-muted-foreground">{appVersion}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm font-medium">Electron Version</span>
                                <span className="text-sm text-muted-foreground">{electronVersion}</span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full md:w-auto" onClick={(): Promise<any> => window.electron.openExternal('https://github.com/Ameliaaaaaaa/PAW-APP')}>
                            <ExternalLink className="h-4 w-4 mr-2"/>
                            View on GitHub
                        </Button>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
};