'use client';

import { Search, Star, LogIn, LogOut, User, Download } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-shell';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ToggleTheme } from '@/components/theme-toggle';
import { useVRChat } from '@/context/vrchat-context';
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
    title: 'Favorites',
    url: '/favorites',
    icon: Star
}];

export function AppSidebar() {
    const [user, setUser] = useState(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [checking, setChecking] = useState(false);
    const { getUserInfo, logout } = useVRChat();
    const { fetchLatestVersion } = usePAW();
    
    const pathname = usePathname();

    useEffect(() => {
        const checkUserAuth = async () => {
            const userInfo = await getUserInfo();

            if (userInfo) setUser(userInfo.data);
        };

        const checkForUpdates = async () => {
            setChecking(true);

            const [version, currentVersion] = await Promise.all([
                fetchLatestVersion(),
                getVersion()
            ]);

            if (version.success) setUpdateAvailable(currentVersion !== version.version);

            setChecking(false);
        };

        checkForUpdates();
        checkUserAuth();
    }, []);

    const configItems = user ? [{
        title: 'Logout',
        action: async () => {
            const result = await logout();
            
            if (result.success) setUser(null);
        },
        icon: LogOut
    }] : [{
        title: 'Login',
        url: '/login',
        icon: LogIn
    }];

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
};