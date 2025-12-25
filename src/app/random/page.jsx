'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import AvatarCard from '@/components/avatar-card';
import { Button } from '@/components/ui/button';
import { usePAW } from '@/context/paw-context';

export default function Page() {
    const [avatars, setAvatars] = useState([]);
    const [loading, setLoading] = useState(false);

    const { fetchRandomAvatars } = usePAW();

    const getRandomAvatars = async () => {
        setLoading(true);

        try {
            const response = await fetchRandomAvatars();

            response.success ? setAvatars(response.results) : toast.error('Failed to fetch random avatars.');
        } catch (e) {
            toast.error('Failed to fetch random avatars.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="container mx-auto px-4 py-8">
            <UpdateTitle />
            
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <h2 className="text-2xl font-bold">Random Avatars</h2>
                        <p className="text-center text-muted-foreground">
                            Click the button below to discover 10 random VRChat avatars.
                        </p>
                        <Button 
                            onClick={getRandomAvatars} 
                            disabled={loading} 
                            className="w-full max-w-md"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Get Random Avatars
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {avatars.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {avatars.map((avatar) => (
                        <div key={avatar.id} className="h-full">
                            <AvatarCard avatar={avatar} />
                        </div>
                    ))}
                </div>
            )}

            {!loading && avatars.length === 0 && (
                <div className="text-center my-12 text-muted-foreground">
                    Click the button above to discover random avatars.
                </div>
            )}
        </div>
    );
};

const UpdateTitle = () => {
    try {
        if (typeof window === 'undefined') return null;
      
        import('@tauri-apps/api/window').then((tauri) => {
            tauri.getCurrentWindow().setTitle('PAW ~ Random');
        });
    } catch (error) {}
    
    return null;
};