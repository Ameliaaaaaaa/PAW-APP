'use client';

import { Search, Star, LogIn, LogOut, User, Download, Camera, Dice6, Clock, TreePine, Palette, Folder, Info, MessageSquare } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import {
    Sidebar as UISidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter
} from '@/components/ui/sidebar';

const mainItems: any = [{
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

const rpcPages: Record<string, string> = {
    '/': 'Searching Avatars',
    '/database_updates': 'Viewing Database Updates',
    '/recent': 'Viewing Recently Seen',
    '/random': 'Finding Random Avatars',
    '/favorites': 'Viewing Favorites',
    '/appearance': 'Changing Appearance',
    '/folders': 'Managing Folders',
    '/about': 'Viewing About'
};

export function AppSidebar({ snowEnabled, setSnowEnabled }: { snowEnabled: boolean, setSnowEnabled: Dispatch<SetStateAction<boolean>> }): JSX.Element {
    const [user, setUser] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [checking, setChecking] = useState(false);
    const [rpcEnabled, setRpcEnabled] = useState(false);

    const rawPathname: string = usePathname();

    const pathname: string = rawPathname.endsWith('/index.html') || rawPathname.includes('/out/index.html') ? '/' : rawPathname;

    const isActive: (url: string) => boolean = (url: string): boolean => url === '/' ? pathname === '/' : pathname.startsWith(url);

    useEffect((): void => {
        const checkUserAuth: () => Promise<void> = async (): Promise<void> => {
            const authStatus: any = await window.electron.VRChat.getAuthStatus();

            if (authStatus.state !== 'authenticated') return;

            const userInfo: any = await window.electron.VRChat.fetchUserInfo();

            userInfo ? setUser(userInfo) : toast.error('Failed to fetch user info.');
        };

        const checkForUpdates: () => Promise<void> = async (): Promise<void> => {
            setChecking(true);

            const [version, currentVersion] = await Promise.all([
                await window.electron.PAW.fetchLatestVersion(),
                await window.electron.getAppVersion()
            ]);

            version.success ? setUpdateAvailable(currentVersion !== version.version) : toast.error('Failed to fetch version.');

            setChecking(false);
        };

        const getRpcStatus: () => Promise<void> = async (): Promise<void> => {
            const rpcStatus: any = await window.electron.DiscordRPC.getEnabled();

            setRpcEnabled(rpcStatus);
        };

        checkForUpdates();
        checkUserAuth();
        getRpcStatus();
    }, []);

    useEffect((): void => {
        window.electron.DiscordRPC.setActivity({
            state: rpcPages[pathname] ?? 'Browsing PAW'
        });
    }, [pathname]);

    const configItems: any = [{
        title: 'Appearance',
        url: '/appearance',
        icon: Palette
    }, {
        title: 'Folder Access',
        url: '/folders',
        icon: Folder
    }, {
        title: 'About',
        url: '/about',
        icon: Info
    }];

    const loginThing: any = user ? [{
        title: 'Logout',
        action: async (): Promise<void> => {
            await window.electron.VRChat.logout();
            setUser(null);
        },
        icon: LogOut
    }] : [{
        title: 'Login',
        url: '/login',
        icon: LogIn
    }];

    const isChristmas: () => boolean = (): boolean => {
        const now = new Date();
        const month: number = now.getMonth();
        const day: number = now.getDate();

        return  (month === 11 && day >= 20) || (month === 0 && day <= 1);
    };

    const handleRpcToggle: (value: boolean) => Promise<void> = async (value: boolean): Promise<void> => {
        setRpcEnabled(value);

        await window.electron.DiscordRPC.setEnabled(value);

        if (value) window.electron.DiscordRPC.setActivity({
            state: rpcPages[pathname] ?? 'Browsing PAW'
        });
    };

    return (
        <UISidebar className="border-r border-border h-svh w-64 sticky top-0 self-start" collapsible="none">
            <SidebarHeader className="h-16 border-b border-border px-6 flex items-center">
                <span className="text-lg font-semibold text-sidebar-foreground">PAW</span>
            </SidebarHeader>
            <SidebarContent className="p-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainItems.map((item: any): JSX.Element => {
                                const Icon: any = item.icon;

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        {item.disabled ? (
                                            <SidebarMenuButton className="w-full gap-2 opacity-50 cursor-not-allowed" title="Coming soon">
                                                <div className="flex items-center">
                                                    <Icon className="h-4 w-4 mr-2" />
                                                    <span>{item.title}</span>
                                                </div>
                                            </SidebarMenuButton>
                                        ) : (
                                            <SidebarMenuButton asChild data-active={isActive(item.url)} className="w-full gap-2 [&[data-active=true]]:bg-accent [&[data-active=true]]:text-accent-foreground">
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
                            <SidebarMenuItem>
                                <div className="flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm">
                                    <div className="flex items-center">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        <span>Discord RPC</span>
                                    </div>
                                    <Switch checked={rpcEnabled} onCheckedChange={handleRpcToggle} />
                                </div>
                            </SidebarMenuItem>

                            {configItems.map((item: any): JSX.Element => {
                                const Icon: any = item.icon;

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        {item.url ? (
                                            <SidebarMenuButton asChild data-active={isActive(item.url)} className="w-full gap-2 [&[data-active=true]]:bg-accent [&[data-active=true]]:text-accent-foreground">
                                                <Link href={item.url} className="flex items-center">
                                                    <Icon className="h-4 w-4 mr-2" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        ) : (
                                            <SidebarMenuButton onClick={item.action} className="w-full gap-2">
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

                <SidebarGroup className="mt-8">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {loginThing.map((item: any): JSX.Element => {
                                const Icon: any = item.icon;

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        {item.url ? (
                                            <SidebarMenuButton asChild data-active={isActive(item.url)} className="w-full gap-2 [&[data-active=true]]:bg-accent [&[data-active=true]]:text-accent-foreground">
                                                <Link href={item.url} className="flex items-center">
                                                    <Icon className="h-4 w-4 mr-2" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        ) : (
                                            <SidebarMenuButton onClick={item.action} className="w-full gap-2">
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

            <SidebarFooter className="mt-auto border-t border-border p-4">
                <div className="flex flex-col gap-4">
                    {user && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.presence?.userIcon ?? user.currentAvatarImageUrl} alt={user.displayName} />
                                    <AvatarFallback>
                                        <User className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{user.displayName}</span>
                                    <span className="text-xs text-muted-foreground">VRChat User</span>
                                </div>
                            </div>
                            {isChristmas() && (
                                <Button onClick={(): void => setSnowEnabled(!snowEnabled)} variant="outline" size="icon">
                                    <TreePine className="h-[1.2rem] w-[1.2rem]" />
                                    <span className="sr-only">Toggle theme</span>
                                </Button>
                            )}
                        </div>
                    )}
                    {updateAvailable && (
                        <button onClick={(): Promise<any> => window.electron.openExternal('https://github.com/Ameliaaaaaaa/PAW-APP/releases/latest')} className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <div className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                <span className="text-xs text-yellow-500">Update Available</span>
                            </div>
                        </button>
                    )}
                    {!user && isChristmas() && (
                        <Button onClick={(): void => setSnowEnabled(!snowEnabled)} variant="outline" size="icon" className="self-start">
                            <TreePine className="h-[1.2rem] w-[1.2rem]" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    )}
                </div>
            </SidebarFooter>
        </UISidebar>
    );
}