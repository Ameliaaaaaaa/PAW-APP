'use client';

import { Search, Camera, Star, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { ToggleTheme } from '@/components/theme-toggle';

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
    title: 'Recently Seen',
    url: '/recent',
    icon: Camera
}, {
    title: 'Favourites',
    url: '/favourites',
    icon: Star
}];

const configItems = [{
    title: 'Login',
    url: '/login',
    icon: LogIn
}];

export function AppSidebar() {
    const pathname = usePathname();

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
            </SidebarContent>
            <SidebarFooter className="border-t border-border p-4">
                <div className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} PAW
                </div>

                <div className="flex items-center space-x-4">
                    <ToggleTheme/>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </UISidebar>
    );
};