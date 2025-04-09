'use client';

import { useEffect } from 'react';

import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { CacheScannerProvider } from '@/context/cache-scanner-context';
import { DatabaseProvider } from '@/context/database-context';
import { ThemeProvider } from '@/components/theme-provider';
import { VRChatProvider } from '@/context/vrchat-context';
import { PAWProvider } from '@/context/paw-context';
import { AppSidebar } from '@/components/sidebar';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';

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
                </SidebarProvider>
                <CacheScannerProvider/>
                <Toaster />
              </PAWProvider>
            </VRChatProvider>
          </DatabaseProvider>
          </ThemeProvider>
      </body>
    </html>
  );
};