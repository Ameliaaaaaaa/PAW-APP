'use client';

import { LogIn, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useVRChat } from '@/context/vrchat-context';
import { Button } from '@/components/ui/button';
import TwoFAModal from '@/components/2fa-modal';
import { Label } from '@/components/ui/label';

export default function Page() {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { authUser, verify2fa } = useVRChat();

    const handleLogin = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        const auth = await authUser(credentials.username, credentials.password);

        if (auth.success) {
          auth.twoFactorAuthType !== 'none' ? setIs2FAModalOpen(true) : toast('Logged in successfully!');
        } else {
          toast('Failed to log in. Please check your credentials.');
        }

        setIsLoading(false);
    };

    const handle2FASubmit = async (code) => {
        setIsLoading(true);

        const verify = await verify2fa(code);

        setIs2FAModalOpen(false);

        verify.success ? toast('Logged in successfully!') : toast('Failed to verify 2FA code.');

        setIsLoading(false);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
            
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[80vh]">
            <UpdateTitle/>
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
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input type="text" id="username" name="username" value={credentials.username} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input type="password" id="password" name="password" value={credentials.password} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md p-2"/>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center">
                                    <span className="animate-spin mr-2">⏳</span> Logging in...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <LogIn className="mr-2 h-4 w-4" /> Login
                                </span>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col">
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Your credentials are stored locally and only used to access VRChat services.
                    </p>
                </CardFooter>
            </Card>
            
            {is2FAModalOpen && (
                <TwoFAModal onClose={() => setIs2FAModalOpen(false)} onSubmit={handle2FASubmit} isLoading={isLoading}/>
            )}
        </div>
    );
};

const UpdateTitle = () => {
    try {
        if (typeof window === 'undefined') return null;
    
        import('@tauri-apps/api/window').then((tauri) => {
            tauri.getCurrentWindow().setTitle('PAW ~ Login');
        });
    } catch (error) {};
  
    return null;
};