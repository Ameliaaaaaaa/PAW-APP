'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import AvatarCard from '@/components/AvatarCard';

export function SimilarAvatarsDialog({ isOpen, onClose, avatar, onFetchSimilar }: { isOpen: any, onClose: any, avatar: any, onFetchSimilar: any }): JSX.Element {
    const [similarAvatars, setSimilarAvatars] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect((): void => {
        if (!isOpen || !avatar) return;

        const fetch: () => Promise<void> = async (): Promise<void> => {
            setLoading(true);
            setSimilarAvatars([]);

            try {
                const results: any = await onFetchSimilar(avatar.id);

                if (!results || results.length === 0) {
                    toast.info('No similar avatars found.');
                    return;
                }

                setSimilarAvatars(results.map((r: any): any => r.avatar));
            } catch {
                toast.error('Failed to load similar avatars.');
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [isOpen, avatar?.id]);

    const handleClose: () => void = (): void => {
        setSimilarAvatars([]);
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Similar Avatars to &quot;{avatar?.name}&quot;</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Finding similar avatars...</span>
                    </div>
                ) : similarAvatars.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <p className="text-sm text-muted-foreground">No similar avatars found.</p>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 overflow-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                            {similarAvatars.map((a: any) => (
                                <AvatarCard key={a.id} avatar={a} fromGraph={true} />
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}