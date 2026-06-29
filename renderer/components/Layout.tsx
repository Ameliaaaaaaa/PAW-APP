import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppSidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import SnowFall from '@/components/SnowFall';

export default function RootLayout({ children }: { children: any }): JSX.Element {
    const isChristmas: () => boolean = (): boolean => {
        const now = new Date();
        const month: number = now.getMonth();
        const day: number = now.getDate();

        return  (month === 11 && day >= 20) || (month === 0 && day <= 1);
    };

    const [snowEnabled, setSnowEnabled] = useState(true);
    const [migrationStatus, setMigrationStatus] = useState(null);

    useEffect((): (() => void) | void => {
        if (typeof window === 'undefined' || !window.electron?.Migration) return;

        let unsubscribe: (() => void) | undefined;

        const init: () => Promise<void> = async (): Promise<void> => {
            const status: any = await window.electron.Migration.getStatus();

            if (status.migrating) setMigrationStatus({
                migrating: true,
                stage: 'starting'
            });

            unsubscribe = window.electron.Migration.onStatusChange((status: any): void => {
                setMigrationStatus(status);
            });
        };

        init();

        return (): void => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const isMigrating: boolean = migrationStatus?.migrating ?? false;

    const getMigrationLabel: () => string = (): string => {
        if (!migrationStatus) return 'Migrating your data...';

        switch (migrationStatus.stage) {
            case 'starting':
            case 'reading':
                return 'Preparing your data...';
            case 'categories':
                return `Migrating categories (${migrationStatus.completed}/${migrationStatus.total})...`;
            case 'favorites':
                return `Migrating favorites (${migrationStatus.completed}/${migrationStatus.total})...`;
            default:
                return 'Migrating your data...';
        }
    };

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {isMigrating && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur-sm">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-lg font-medium">{getMigrationLabel()}</p>
                    <p className="text-sm text-muted-foreground">Please don't close the app while this completes.</p>
                </div>
            )}

            {isChristmas() && snowEnabled && <SnowFall />}
            <SidebarProvider defaultOpen>
                <AppSidebar snowEnabled={snowEnabled} setSnowEnabled={setSnowEnabled} />
                <SidebarInset>
                    <div className="flex min-h-screen flex-col">
                        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6"></div>
                        <main className="flex-1 p-6">
                            {children}
                        </main>
                    </div>
                </SidebarInset>
            </SidebarProvider>
            <Toaster />
        </ThemeProvider>
    );
};