'use client';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { useState } from 'react';
import { toast } from 'sonner';

import { useVRChat } from '@/context/vrchat-context';
import TwoFAModal from '@/components/2fa-modal';

export default function LoginPage() {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

    const { authUser, verify2fa } = useVRChat();

    const handleLogin = async (event) => {
        event.preventDefault();

        const auth = await authUser(credentials.username, credentials.password);

        if (auth.success) {
            if (auth.twoFactorAuthType !== 'none') {
                setIs2FAModalOpen(true);
            } else {
                toast('Logged in successfully!');
            }
        } else {
            toast('Failed to log in.');
        }
    };

    const handle2FASubmit = async (code) => {
        const verify = await verify2fa(code);

        setIs2FAModalOpen(false);

        if (verify.success) {
            toast('Logged in successfully!');
        } else {
            toast('Failed to log in.');
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-8">Login</h1>
                <UpdateTitle />
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium">Username</label>
                        <input 
                            type="text" 
                            id="username" 
                            name="username" 
                            value={credentials.username} 
                            onChange={handleChange} 
                            required 
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            value={credentials.password} 
                            onChange={handleChange} 
                            required 
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full p-2 bg-blue-500 text-white rounded"
                    >
                        Login
                    </button>
                </form>
                {is2FAModalOpen && (
                    <TwoFAModal 
                        isOpen={is2FAModalOpen} 
                        onClose={() => setIs2FAModalOpen(false)} 
                        onSubmit={handle2FASubmit} 
                    />
                )}
            </div>
        </div>
    );
};

function UpdateTitle() {
    try {
        getCurrentWindow().setTitle('PAW ~ Login');
    } catch (error) {};

    return null;
};