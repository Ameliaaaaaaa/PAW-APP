'use client';

import { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function RefreshDialog({ avatarId, isOpen, onClose }: { avatarId: string, isOpen: any, onClose: any }): JSX.Element {
    const [refreshStatus, setRefreshStatus] = useState('idle');

    const handleRefresh: () => any = async (): Promise<void> => {
        setRefreshStatus('loading');

        const response: any = await window.electron.PAW.refreshAvatar(avatarId);

        response.success ? setRefreshStatus('success') : setRefreshStatus('error');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Avatar Refresh</DialogTitle>
                    <DialogDescription>Please click the button below to request a refresh for this avatar.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-4">
                    <Button onClick={handleRefresh} disabled={refreshStatus === 'loading'}>
                        {refreshStatus === 'loading' ? 'Refreshing...' : 'Refresh Avatar'}
                    </Button>
                    {refreshStatus === 'success' && <p className="text-green-600">Avatar refresh requested successfully!</p>}
                    {refreshStatus === 'error' && (
                        <p className="text-red-600">Failed to request avatar refresh. Please try again.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}