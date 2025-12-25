'use client';

import { writeFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import WidgetBot from '@widgetbot/react-embed';
import { error } from '@tauri-apps/plugin-log';
import { useEffect, useState } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { toast } from 'sonner';

import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { DatabaseProvider } from '@/context/database-context';
import { ThemeProvider } from '@/components/theme-provider';
import { VrcLogProvider } from '@/context/vrc-log-context';
import { VRChatProvider } from '@/context/vrchat-context';
import { PAWProvider } from '@/context/paw-context';
import { AppSidebar } from '@/components/sidebar';
import { Toaster } from '@/components/ui/sonner';
import Snowfall from '@/components/snow-fall';

import './globals.css';

const DiscordWidget = () => {
    const [api, setApi] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleAPI = (widgetApi) => {
        setApi(widgetApi);
    };

    const toggleWidget = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {isOpen ? (
                <div className="relative">
                    <WidgetBot
                        server="1331153121472282652"
                        channel="1365795038604562443"
                        width="350"
                        height="400"
                        onAPI={handleAPI}
                    />
                    <button
                        onClick={toggleWidget}
                        className="absolute -top-2 -right-2 bg-background rounded-full p-2 shadow-md hover:bg-muted transition-colors"
                        aria-label="Close Discord Widget"
                    >
                        <FaDiscord className="w-6 h-6 text-[#5865F2]" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={toggleWidget}
                    className="bg-background rounded-full p-4 shadow-md hover:bg-muted transition-colors"
                    aria-label="Open Discord Widget"
                >
                    <FaDiscord className="w-8 h-8 text-[#5865F2]" />
                </button>
            )}
        </div>
    );
};

export default function RootLayout({ children }) {
    const DisableMenu = () => {
        if (typeof window === 'undefined') return;
        if (window.location.hostname !== 'tauri.localhost') return;

        document.addEventListener('contextmenu', async (e) => {
            e.preventDefault();

            if (e.target.tagName === 'IMG') {
                const existingMenus = document.querySelectorAll('.context-menu');

                existingMenus.forEach(menu => document.body.removeChild(menu));

                const menu = document.createElement('div');

                menu.className = 'fixed bg-background shadow-lg rounded-md p-2 z-50 context-menu';

                const x = Math.min(e.pageX, window.innerWidth - 200);
                const y = Math.min(e.pageY, window.innerHeight - 100);

                menu.style.left = `${x}px`;
                menu.style.top = `${y}px`;

                const saveAsButton = document.createElement('button');

                saveAsButton.className = 'w-full text-left px-3 py-1 hover:bg-muted rounded-sm';
                saveAsButton.textContent = 'Save Image As...';

                saveAsButton.onclick = async () => {
                    try {
                        const response = await fetch(e.target.src);
                        const imageData = await response.arrayBuffer();

                        const savePath = await save({
                            filters: [{
                                name: 'Image',
                                extensions: [
                                    'png', 'jpg', 'jpeg'
                                ],
                                defaultPath: e.target.alt || 'image'
                            }]
                        });

                        if (savePath) {
                            await writeFile(savePath, new Uint8Array(imageData));
                            toast.success('Avatar image saved.');
                        }
                    } catch (e) {
                        await error(e);
                        toast.error('Failed to save avatar image.');
                    }

                    document.body.removeChild(menu);
                };

                menu.appendChild(saveAsButton);
                document.body.appendChild(menu);

                const closeMenu = (e) => {
                    if (!menu.contains(e.target)) {
                        document.body.removeChild(menu);
                        document.removeEventListener('click', closeMenu);
                    }
                };

                document.addEventListener('click', closeMenu);
            }

            return false;
        }, {
            capture: true
        });

        document.addEventListener('selectstart', (e) => {
            const targetElement = e.target;

            const isText = window.getSelection().type === 'Range' || targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.isContentEditable || (targetElement.parentElement && targetElement.parentElement.tagName === 'P') || targetElement.tagName === 'P' || targetElement.tagName === 'SPAN' || targetElement.tagName === 'DIV';

            if (isText) return true;

            e.preventDefault();

            return false;
        }, {
            capture: true
        });
    };

    const DisableRefresh = () => {
        if (typeof window === 'undefined') return;
        if (window.location.hostname !== 'tauri.localhost') return;

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                const targetElement = e.target;

                if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.isContentEditable) return true;
            }

            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) e.preventDefault();
        });
    };

    useEffect(() => {
        DisableMenu();
        DisableRefresh();
    }, []);

    const isChristmas = () => {
        const now = new Date();
        const month = now.getMonth();
        const day = now.getDate();

        return  (month === 11 && day >= 20) || (month === 0 && day <= 1);
    };

    const [snowEnabled, setSnowEnabled] = useState(true);

    return (
        <html lang="en" suppressHydrationWarning>
        <body>
        <DisableMenu/>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <DatabaseProvider>
                <VRChatProvider>
                    <PAWProvider>
                        <VrcLogProvider>
                            {isChristmas() && snowEnabled && <Snowfall />}
                            <SidebarProvider>
                                <AppSidebar snowEnabled={snowEnabled} setSnowEnabled={setSnowEnabled} />
                                <SidebarInset>
                                    <div className="flex min-h-screen flex-col">
                                        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
                                            <SidebarTrigger />
                                        </header>
                                        <main className="flex-1 p-6">
                                            {children}
                                        </main>
                                    </div>
                                </SidebarInset>
                                <DiscordWidget />
                            </SidebarProvider>
                        </VrcLogProvider>
                        <Toaster />
                    </PAWProvider>
                </VRChatProvider>
            </DatabaseProvider>
        </ThemeProvider>
        </body>
        </html>
    );
};