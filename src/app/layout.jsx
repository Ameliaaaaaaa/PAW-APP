'use client';

import WidgetBot from '@widgetbot/react-embed';
import { FaDiscord } from 'react-icons/fa';
import { useEffect } from 'react';
import * as React from 'react';

import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { CacheScannerProvider } from '@/context/cache-scanner-context';
import { DatabaseProvider } from '@/context/database-context';
import { ThemeProvider } from '@/components/theme-provider';
import { VRChatProvider } from '@/context/vrchat-context';
import { PAWProvider } from '@/context/paw-context';
import { AppSidebar } from '@/components/sidebar';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';

const DiscordWidget = () => {
  const [api, setApi] = React.useState(null);
  const [isOpen, setIsOpen] = React.useState(false);

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

    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();

      return false;
    }, {
      capture: true
    });

    document.addEventListener('selectstart', (e) => {
      const targetElement = e.target;

      if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.isContentEditable) return true;
    
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

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DisableMenu/>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DatabaseProvider>
            <VRChatProvider>
              <PAWProvider>
                <CacheScannerProvider>
                  <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                      <div className="flex min-h-screen flex-col">
                        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
                          <SidebarTrigger />
                          <div className="flex-1">
                            <h1 className="text-xl font-semibold">VRChat Avatar Search</h1>
                          </div>
                        </header>
                        <main className="flex-1 p-6">
                          {children}
                        </main>
                      </div>
                    </SidebarInset>
                    <DiscordWidget />
                  </SidebarProvider>
                </CacheScannerProvider>
                <Toaster />
              </PAWProvider>
            </VRChatProvider>
          </DatabaseProvider>
          </ThemeProvider>
      </body>
    </html>
  );
};