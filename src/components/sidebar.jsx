'use client';

import { Search, Star, LogIn, LogOut, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ToggleTheme } from '@/components/theme-toggle';
import { useVRChat } from '@/context/vrchat-context';

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

    const pathname = usePathname();

    const { getUserInfo, logout } = useVRChat();
    
    useEffect(() => {
        const checkUserAuth = async () => {
            const userInfo = await getUserInfo();

            if (userInfo) setUser(userInfo.data);
        };
    
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
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} PAW</div>
            <ToggleTheme />
          </div>
        )}
      </SidebarFooter>
            <SidebarRail />
        </UISidebar>
    );
};