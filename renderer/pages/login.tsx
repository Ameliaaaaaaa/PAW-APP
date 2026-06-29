'use client';

import { Lock, LogIn, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import TwoFAModal from '@/components/2FA';

export default function Page(): JSX.Element {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });

    const [authState, setAuthState] = useState('idle');
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

    const router: any = useRouter();

    useEffect((): (() => void) => {
        window.electron.VRChat.getAuthStatus().then((status: any): void => {
            setAuthState(status.state);
        });

        return window.electron.VRChat.onAuthStateChange((status: any): void => {
            setAuthState(status.state);
        });
    }, []);

    useEffect((): void => {
        if (authState === 'authenticated') {
            toast.success('Logged in successfully!');
            router.replace('/');
        }

        if (authState === 'needs_2fa') setIs2FAModalOpen(true);
        if (authState === 'error') toast.error('Failed to log in.');
    }, [authState]);

    const isLoading: boolean = authState === 'authenticating';

    const handleLogin: any = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();

        try {
            await window.electron.VRChat.login(credentials.username, credentials.password);
        } catch {}
    };

    const handle2FASubmit: any = async (code: string): Promise<void> => {
        try {
            await window.electron.VRChat.submitTwoFactor(code);
            setIs2FAModalOpen(false);
        } catch {}
    };

    const handleChange: any = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = event.target;

        setCredentials((prev: any): any => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Login to VRChat</CardTitle>
                    <CardDescription className="text-center">
                        Enter your VRChat credentials to access certain avatar features
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username/Email</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input id="username" name="username" type="text" value={credentials.username} onChange={handleChange} className="pl-9" disabled={isLoading} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input id="password" name="password" type="password" value={credentials.password} onChange={handleChange} className="pl-9" disabled={isLoading} required />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading || !credentials.username || !credentials.password}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span> Logging in...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <LogIn className="h-4 w-4" /> Login
                                </span>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground text-center w-full">
                        Your credentials are stored locally and only used to access VRChat services.
                    </p>
                </CardFooter>
            </Card>

            {is2FAModalOpen && (
                <TwoFAModal onClose={(): void => {
                    setIs2FAModalOpen(false);
                    window.electron.VRChat.cancelLogin();
                }} onSubmit={handle2FASubmit} isLoading={isLoading}/>
            )}
        </div>
    );
};