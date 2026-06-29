'use client';

import { File, Folder } from 'lucide-react';

import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Page(): JSX.Element {
    const openFolder: (type: string) => Promise<void> = async (type: string): Promise<void> => {
        if (type === 'storeData') await window.electron.openStoreData();
        if (type === 'userData') await window.electron.openUserData();
        if (type === 'installData') await window.electron.openInstallData();
    };

    return (
        <div>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center gap-3 mb-8">
                    <File className="h-8 w-8"/>
                    <h1 className="text-4xl font-bold">Folder Access</h1>
                </div>

                <Card className="mb-6">
                    <CardHeader className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button variant="outline" className="justify-start" onClick={(): Promise<void> => openFolder('storeData')}>
                                <Folder className="h-4 w-4 mr-2" />
                                Open Store Data
                            </Button>

                            <Button variant="outline" className="justify-start" onClick={(): Promise<void> => openFolder('userData')}>
                                <Folder className="h-4 w-4 mr-2" />
                                Open User Data Folder
                            </Button>

                            <Button variant="outline" className="justify-start" onClick={(): Promise<void> => openFolder('installData')}>
                                <Folder className="h-4 w-4 mr-2" />
                                Open Install Data
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
};