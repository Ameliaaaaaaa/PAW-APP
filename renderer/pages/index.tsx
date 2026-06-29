'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Shield, Eye, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import SearchInput from '@/components/SearchInput';
import AvatarCard from '@/components/AvatarCard';
import { Button } from '@/components/ui/button';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

const AVATAR_CARD_WIDTH = 320;
const AVATAR_CARD_HEIGHT = 590;
const GRID_GAP = 20;

export default function Page(): JSX.Element {
    const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
    const [privacyCheckComplete, setPrivacyCheckComplete] = useState(false);

    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [avatars, setAvatars] = useState([]);
    const [currentSearchType, setCurrentSearchType] = useState('name');
    const [currentQuery, setCurrentQuery] = useState('');
    const [currentPlatforms, setCurrentPlatforms] = useState([]);  const [currentOrderBy, setCurrentOrderBy] = useState('newest');
    const [currentRatingParams, setCurrentRatingParams] = useState<Record<string, string>>({});
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
    const [hasSearched, setHasSearched] = useState(false);
    const [allItemsLoaded, setAllItemsLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gridColumns, setGridColumns] = useState(3);

    const containerRef: any = useRef(null);
    const pageRef: any = useRef(1);
    const isLoadingMoreRef: any = useRef(false);
    const loadingRef: any = useRef(null);
    const scrollListenerRef: any = useRef(null);
    const resizeObserverRef: any = useRef(null);

    const handlePrivacyAccept: () => Promise<void> = async (): Promise<void> => {
        try {
            localStorage.setItem('privacy-notice-seen', 'true');
            setShowPrivacyDialog(false);
        } catch (error) {
            setShowPrivacyDialog(false);
        }
    };

    const handleSearch: any = (type: string, query: string, platforms: [], orderBy: string, ratingParams: Record<string, string> = {}): void => {
        if (!query.trim()) return;

        setAvatars([]);
        setCurrentSearchType(type);
        setCurrentQuery(query);
        setCurrentPlatforms(platforms);
        setCurrentOrderBy(orderBy);
        setCurrentRatingParams(ratingParams);
        setHasNextPage(true);
        setTotalItems(0);

        setVisibleRange({
            start: 0,
            end: 20
        });

        pageRef.current = 1;

        setHasSearched(true);
        setAllItemsLoaded(false);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const getTotalHeight: () => number = (): number => {
        const rowCount: number = Math.ceil(avatars.length / gridColumns);

        return rowCount * (AVATAR_CARD_HEIGHT + GRID_GAP);
    };

    const getVisibleAvatars: () => any[] = (): any[] => {
        return avatars.slice(visibleRange.start, visibleRange.end);
    };

    const getAvatarPosition: any = (index: any): any => {
        const adjustedIndex: any = index + visibleRange.start;
        const row: number = Math.floor(adjustedIndex / gridColumns);
        const column: number = adjustedIndex % gridColumns;

        const top: number = row * (AVATAR_CARD_HEIGHT + GRID_GAP);
        const left = `${(column * (100 / gridColumns))}%`;

        return {
            top,
            left,
            width: `calc(${100 / gridColumns}% - ${GRID_GAP}px)`
        };
    };

    const fetchAvatars: any = useCallback(async (): Promise<void> => {
        if (loading || !hasNextPage || isLoadingMoreRef.current) return;

        isLoadingMoreRef.current = true;

        setLoading(true);

        try {
            const response: any = await window.electron.PAW.searchAvatars(currentSearchType, currentQuery, currentPlatforms.join(','), pageRef, currentOrderBy, currentRatingParams);

            if (!response?.success || !response.data?.success) {
                toast.error('Failed to fetch avatars.');
                setHasNextPage(false);
                setAllItemsLoaded(true);
                return;
            }

            setAvatars((prev: any[]): any[] => [...prev, ...response.data.results]);
            setHasNextPage(response.data.pagination.hasNextPage);
            setTotalItems(response.data.pagination.totalCount);
            setAllItemsLoaded(!response.data.pagination.hasNextPage);

            pageRef.current += 1;
        } catch (e) {
            toast.error('Failed to fetch avatars.');
            setHasNextPage(false);
            setAllItemsLoaded(true);
        } finally {
            setLoading(false);

            isLoadingMoreRef.current = false;
        }
    }, [loading, hasNextPage, currentSearchType, currentQuery, currentPlatforms, currentOrderBy]);

    useEffect((): void => {
        const checkPrivacyNotice: () => Promise<void> = async (): Promise<void> => {
            try {
                const hasSeenNotice: string = localStorage.getItem('privacy-notice-seen');

                if (!hasSeenNotice) setShowPrivacyDialog(true);
            } catch (error) {
                setShowPrivacyDialog(true);
            } finally {
                setPrivacyCheckComplete(true);
            }
        };

        const getStats: () => void = async (): Promise<void> => {
            setStatsLoading(true);

            try {
                const response: any = await window.electron.PAW.fetchStats();

                response.success ? setStats(response.stats) : toast.error('Failed to load stats.');
            } catch (e) {
                toast.error('Failed to load stats.');
            } finally {
                setStatsLoading(false);
            }
        };

        checkPrivacyNotice();
        getStats();
    }, []);

    useEffect((): () => void => {
        const container: any = containerRef.current;

        if (!container) return;

        const calculateGridColumns: () => void = (): void => {
            if (!container) return;

            const containerWidth: any = container.clientWidth;
            const columns: number = Math.max(1, Math.floor((containerWidth + GRID_GAP) / (AVATAR_CARD_WIDTH + GRID_GAP)));

            setGridColumns(columns);
        };

        const handleScroll: () => void = (): void => {
            if (!hasSearched) return;

            const scrollTop: number = window.scrollY;
            const containerTop: any = container.getBoundingClientRect().top + window.scrollY;
            const relativeScrollTop: number = Math.max(0, scrollTop - containerTop);

            const rowHeight: number = AVATAR_CARD_HEIGHT + GRID_GAP;

            const buffer = 5;
            const visibleWindowHeight: number = window.innerHeight;

            const startRow: number = Math.max(0, Math.floor(relativeScrollTop / rowHeight) - buffer);
            const endRow: number = Math.ceil((relativeScrollTop + visibleWindowHeight) / rowHeight) + buffer;

            const startIndex: number = startRow * gridColumns;
            const endIndex: number = Math.min(avatars.length, endRow * gridColumns);

            setVisibleRange({
                start: startIndex,
                end: endIndex
            });

            const loadingElement: any = loadingRef.current;

            if (loadingElement && hasNextPage && !loading && !isLoadingMoreRef.current && loadingElement.getBoundingClientRect().top < window.innerHeight + 500) fetchAvatars();
        };

        resizeObserverRef.current = new ResizeObserver((): void => {
            calculateGridColumns();
            handleScroll();
        });

        resizeObserverRef.current.observe(container);

        scrollListenerRef.current = handleScroll;

        window.addEventListener('scroll', handleScroll, {
            passive: true
        });

        calculateGridColumns();
        handleScroll();

        return (): void => {
            window.removeEventListener('scroll', handleScroll);

            if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
        };
    }, [hasSearched, loading, hasNextPage, avatars.length, gridColumns]);

    useEffect((): void => {
        if (hasSearched) fetchAvatars();
    }, [hasSearched, fetchAvatars]);

    let total;

    if (stats) total = Array.from({ length: 10 }, (_: unknown, i: number): number => i + 1) .reduce((sum: number, p: number): any => sum + (stats.queue.priority[p] || 0), 0);

    return (
        <div>
            <Dialog open={showPrivacyDialog && privacyCheckComplete} onOpenChange={setShowPrivacyDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <Shield className="h-6 w-6 text-primary" />
                            Your Privacy Matters
                        </DialogTitle>
                        <DialogDescription className="text-base pt-4">
                            Welcome to PAW! Here's how we protect your privacy:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex gap-3">
                            <Eye className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold mb-1">Local Scanning Only</h4>
                                <p className="text-sm text-muted-foreground">
                                    PAW scans your VRChat output logs and amplitude cache file locally on your device to find avatar IDs you've encountered. Only these IDs are submitted to our servers.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Lock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold mb-1">Your Data Stays Local</h4>
                                <p className="text-sm text-muted-foreground">
                                    When you log in, your account information is never sent to PAW servers. All your personal data is stored and used exclusively on your device.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold mb-1">Privacy First</h4>
                                <p className="text-sm text-muted-foreground">
                                    We believe in transparency. Your VRChat account credentials and personal information remain completely private to you.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handlePrivacyAccept} className="w-full">
                            I Understand
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <h1 className="text-4xl font-bold mb-8 text-center">VRChat Avatar Search</h1>
            <p className="text-center mb-8">Use the toggle to switch between searching by avatar name, description, author ID or AI.</p>

            <div className="w-full px-4 py-8" ref={containerRef}>
                {statsLoading ? (
                    <div className="flex justify-center items-center h-16">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    stats && (
                        <Card className="mb-6">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold">{Number(stats.avatars).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                                        <p className="text-sm text-gray-500">Avatars</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {total.toLocaleString('en-US', {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-500">Avatars Queued</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{Number(stats.queue.active).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                                        <p className="text-sm text-gray-500">Avatars Processing</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                )}

                <SearchInput onSearch={handleSearch} />
                <br />
                {!loading && hasSearched && avatars.length === 0 && (
                    <div className="text-center mb-4">No avatars found. Try a different search term or platform combination.</div>
                )}
                {!loading && !hasSearched && (
                    <div className="text-center mb-4">Enter a search term to find VRChat avatars.</div>
                )}

                {hasSearched && (
                    <div className="relative">
                        <div style={{ height: getTotalHeight() + 100 }}></div>

                        <div className="absolute top-0 left-0 w-full">
                            {getVisibleAvatars().map((avatar: any, index: any): JSX.Element => {
                                const position: any = getAvatarPosition(index);

                                return (
                                    <div key={avatar.id || index + visibleRange.start} className="absolute" style={{
                                        top: position.top,
                                        left: position.left,
                                        width: position.width,
                                        height: AVATAR_CARD_HEIGHT,
                                        padding: `0 ${GRID_GAP/2}px ${GRID_GAP}px 0`
                                    }}>
                                        <AvatarCard avatar={avatar} />
                                    </div>
                                );
                            })}
                        </div>

                        <div ref={loadingRef} className="loading-indicator w-full text-center py-8" style={{
                            position: 'absolute',
                            top: getTotalHeight()
                        }}>
                            {loading ? (
                                <Loader2 className="h-8 w-8 animate-spin inline-block" />
                            ) : !allItemsLoaded ? (
                                <div className="text-gray-400">Loading more results...</div>
                            ) : (
                                <div className="text-gray-400">End of results • {avatars.length} avatars found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};