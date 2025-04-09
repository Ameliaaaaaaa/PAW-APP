'use client';

import { useState, useEffect } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useVRChat } from '@/context/vrchat-context';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function AvatarInfoDialog({ avatarId, isOpen, onClose }) {
    if (!avatarId) return null;

    const [avatar, setAvatar] = useState({});
    const { getAvatar } = useVRChat();

    const fetchData = async () => {
        const avatarResponse = await getAvatar(avatarId);
    
        if (avatarResponse.success) setAvatar(avatarResponse.data);
    };

    useEffect(() => {
        isOpen ? fetchData() : setAvatar({});
    }, [isOpen, avatarId]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">{avatar.name}</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12">
                        <TabsTrigger value="details" className="text-sm font-medium">Details</TabsTrigger>
                        <TabsTrigger value="packages" className="text-sm font-medium">Unity Packages</TabsTrigger>
                    </TabsList>
                    <ScrollArea className="h-[70vh] w-full rounded-md mt-6">
                        <TabsContent value="details" className="p-6 space-y-8">
                            <div className="flex gap-8">
                                <div className="w-1/3">
                                    <div className="relative aspect-[1/1] overflow-hidden rounded-xl">
                                        <img
                                            src={avatar.thumbnailImageUrl || '/placeholder.svg'}
                                            alt={avatar.name}
                                            className="w-full h-full object-cover shadow-xl transition-transform hover:scale-105"
                                        />
                                    </div>
                                </div>
                                <div className="w-2/3 space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-semibold">Basic Information</h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <p className="flex items-center">
                                                    <span className="text-muted-foreground w-16 flex-shrink-0">ID</span>
                                                    <span className="font-medium break-all">{avatar.id}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-muted-foreground">Author</span>
                                                    <span className="font-medium">{avatar.authorName}</span>
                                                </p>
                                                <p className="flex items-center">
                                                    <span className="text-muted-foreground w-16 flex-shrink-0">Author ID</span>
                                                    <span className="font-medium break-all">{avatar.authorId}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-muted-foreground">Release Status</span>
                                                    <Badge variant="outline" className="font-medium">{avatar.releaseStatus}</Badge>
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="flex justify-between">
                                                    <span className="text-muted-foreground">Version</span>
                                                    <span className="font-medium">{avatar.version}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-muted-foreground">Created</span>
                                                    <span className="font-medium">{new Date(avatar.created_at).toLocaleString()}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="text-muted-foreground">Updated</span>
                                                    <span className="font-medium">{new Date(avatar.updated_at).toLocaleString()}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-semibold">Description</h3>
                                        <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{avatar.description}</p>
                                    </div>
                                    
                                    {avatar.tags && avatar.tags.length > 0 && (
                                        <>
                                            <Separator />
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-semibold">Tags</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {avatar.tags.map((tag, index) => (
                                                        <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">{tag}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="packages" className="p-6 space-y-6">
                            {avatar.unityPackages?.map((pkg, index) => (
                                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-semibold">Package {index + 1}</h3>
                                        <Badge className="px-3 py-1">{pkg.platform}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground">Unity Version</span>
                                                <span className="font-medium">{pkg.unityVersion}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground">Asset Version</span>
                                                <span className="font-medium">{pkg.assetVersion}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground">Performance</span>
                                                <Badge variant="outline">{pkg.performanceRating}</Badge>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground">Created</span>
                                                <span className="font-medium">{new Date(pkg.created_at).toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground">Impostor Version</span>
                                                <span className="font-medium">{pkg.impostorizerVersion}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground">Unity Sort Number</span>
                                                <span className="font-medium">{pkg.unitySortNumber}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground">Scan Status</span>
                                                <span className="font-medium">{pkg.scanStatus || 'N/A'}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground">Variant</span>
                                                <span className="font-medium">{pkg.variant || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};