'use client';

import { Info, ExternalLink, Heart, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Page(): JSX.Element {
    const [appVersion, setAppVersion] = useState('Loading...');
    const [electronVersion, setElectronVersion] = useState('Loading...');
    const [supporters, setSupporters] = useState([]);
    const [donators, setDonators] = useState([]);
    const [donatorsLoading, setDonatorsLoading] = useState(true);

    useEffect((): void => {
        const getVersions: () => Promise<void> = async (): Promise<void> => {
            const app: string = await window.electron.getAppVersion();
            const electron: string = await window.electron.getElectronVersion();

            setAppVersion(app);
            setElectronVersion(electron);
        };

        const getDonators: () => Promise<void> = async (): Promise<void> => {
            const result: any = await window.electron.PAW.fetchDonators();

            if (result.success && result.data) {
                setSupporters(result.data.Supporter ?? []);
                setDonators(result.data.Donator ?? []);
            }

            setDonatorsLoading(false);
        };

        getVersions();
        getDonators();
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
                        <Button variant="outline" className="w-full md:w-auto" onClick={(): Promise<any> => window.electron.openExternal('https://ko-fi.com/pawvrc')}>
                            <Heart className="h-4 w-4 mr-2"/>
                            Support on Ko-fi
                        </Button>
                    </CardHeader>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Star className="h-5 w-5"/>
                            <h2 className="text-xl font-semibold">Supporters</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">Monthly supporters of PAW</p>
                    </CardHeader>
                    <CardContent>
                        {donatorsLoading ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : supporters.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {supporters.map((name: string): JSX.Element => (
                                    <span key={name} className="px-3 py-1 rounded-full bg-muted text-sm font-medium">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No supporters yet.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Heart className="h-5 w-5"/>
                            <h2 className="text-xl font-semibold">Donators</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">One-time donators of PAW</p>
                    </CardHeader>
                    <CardContent>
                        {donatorsLoading ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : (
                            ((): JSX.Element => {
                                const supporterSet = new Set(supporters);
                                const oneTimeOnly: any[] = donators.filter((name: string): boolean => !supporterSet.has(name));

                                return oneTimeOnly.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {oneTimeOnly.map((name: string): JSX.Element => (
                                            <span key={name} className="px-3 py-1 rounded-full bg-muted text-sm font-medium">
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No donators yet.</p>
                                );
                            })()
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};