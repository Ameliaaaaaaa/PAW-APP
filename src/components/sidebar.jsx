'use client';

import { Search, Star, LogIn, LogOut, User, Download, Camera, Dice6, Clock, TreePine } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-shell';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ToggleTheme } from '@/components/theme-toggle';
import { useVRChat } from '@/context/vrchat-context';
import { Button } from '@/components/ui/button';
import { usePAW } from '@/context/paw-context';

import {
    Sidebar as UISidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarRail,
} from '@/components/ui/sidebar';

const mainItems = [{
    title: 'Search Avatars',
    url: '/',
    icon: Search
}, {
    title: 'Database Updates',
    url: '/database_updates',
    icon: Clock
}, {
    title: 'Recently Seen',
    url: '/recent',
    icon: Camera
}, {
    title: 'Random',
    url: '/random',
    icon: Dice6
}, {
    title: 'Favorites',
    url: '/favorites',
    icon: Star
}];

export function AppSidebar({ snowEnabled, setSnowEnabled }) {
    const [user, setUser] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [checking, setChecking] = useState(false);
    const { getUserInfo, logout } = useVRChat();
    const { fetchLatestVersion } = usePAW();
    
    const pathname = usePathname();

    useEffect(() => {
        const checkUserAuth = async () => {
            const userInfo = await getUserInfo();

            userInfo.success ? setUser(userInfo.data) : toast.error('Failed to fetch user info.');
        };

        const checkForUpdates = async () => {
            setChecking(true);

            const [version, currentVersion] = await Promise.all([
                fetchLatestVersion(),
                getVersion()
            ]);

            version.success ? setUpdateAvailable(currentVersion !== version.version) : toast.error('Failed to fetch version.');

            setChecking(false);
        };

        checkForUpdates();
        checkUserAuth();
    }, []);

    const configItems = user ? [{
        title: 'Logout',
        action: async () => {
            const result = await logout();
            
            result.success ? setUser(null) : toast.error('Failed to logout.');
        },
        icon: LogOut
    }] : [{
        title: 'Login',
        url: '/login',
        icon: LogIn
    }];

    const isChristmas = () => {
        const now = new Date();
        const month = now.getMonth();
        const day = now.getDate();

        return  (month === 11 && day >= 20) || (month === 0 && day <= 1);
    };

    return (
        <UISidebar className="border-r border-border">
            <SidebarHeader className="h-16 border-b border-border px-6 flex items-center">
                <span className="text-lg font-semibold">PAW</span>
            </SidebarHeader>
            <SidebarContent className="p-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        {item.disabled ? (
                                            <SidebarMenuButton
                                                className="w-full gap-2 opacity-50 cursor-not-allowed"
                                                title="Coming soon"
                                            >
                                                <div className="flex items-center">
                                                    <Icon className="h-4 w-4 mr-2" />
                                                    <span>{item.title}</span>
                                                </div>
                                            </SidebarMenuButton>
                                        ) : (
                                            <SidebarMenuButton
                                                asChild
                                                data-active={pathname === item.url}
                                                className="w-full gap-2 [&[data-active=true]]:bg-accent [&[data-active=true]]:text-accent-foreground"
                                            >
                                                <Link href={item.url} className="flex items-center">
                                                    <Icon className="h-4 w-4 mr-2" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        )}
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                
                <SidebarGroup className="mt-8">
                    <div className="mb-2 px-4 text-xs font-medium text-muted-foreground">
                        Configuration
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {configItems.map((item) => {
                                const Icon = item.icon;
                                
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        {item.url ? (
                                            <SidebarMenuButton
                                                asChild
                                                data-active={pathname === item.url}
                                                className="w-full gap-2 [&[data-active=true]]:bg-accent [&[data-active=true]]:text-accent-foreground"
                                            >
                                                <Link href={item.url} className="flex items-center">
                                                    <Icon className="h-4 w-4 mr-2" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        ) : (
                                            <SidebarMenuButton
                                                onClick={item.action}
                                                className="w-full gap-2"
                                            >
                                                <div className="flex items-center">
                                                    <Icon className="h-4 w-4 mr-2" />
                                                    <span>{item.title}</span>
                                                </div>
                                            </SidebarMenuButton>
                                        )}
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-border p-4">
                {user ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.presence.userIcon ? user.presence.userIcon : user.currentAvatarImageUrl} alt={user.displayName} />
                                    <AvatarFallback>
                                        <User className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{user.displayName}</span>
                                    <span className="text-xs text-muted-foreground">VRChat User</span>
                                </div>
                            </div>
                            <ToggleTheme />
                            {isChristmas() && (
                                <Button onClick={() => setSnowEnabled(!snowEnabled)} variant="outline" size="icon">
                                    <TreePine className="h-[1.2rem] w-[1.2rem]" />
                                    <span className="sr-only">Toggle theme</span>
                                </Button>
                            )}
                        </div>
                            {updateAvailable && (
                                <button onClick={() => open('https://github.com/Ameliaaaaaaa/PAW-APP/releases/latest')} className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <div className="flex items-center gap-1">
                                        <Download className="h-3 w-3" />
                                        <span className="text-xs text-yellow-500">Update Available</span>
                                    </div>
                                </button>
                            )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <ToggleTheme />
                            {isChristmas() && (
                                <Button onClick={() => setSnowEnabled(!snowEnabled)} variant="outline" size="icon">
                                    <TreePine className="h-[1.2rem] w-[1.2rem]" />
                                    <span className="sr-only">Toggle theme</span>
                                </Button>
                            )}
                        </div>
                        {updateAvailable && (
                            <button onClick={() => open('https://github.com/Ameliaaaaaaa/PAW-APP/releases/latest')} className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <div className="flex items-center gap-1">
                                    <Download className="h-3 w-3" />
                                    <span className="text-xs text-yellow-500">Update Available</span>
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </SidebarFooter>
            <SidebarRail />
        </UISidebar>
    );
}