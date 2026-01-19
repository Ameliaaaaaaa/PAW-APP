'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Shield, Eye, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { useLanguage } from '@/context/language-provider-context';
import { Card, CardContent } from '@/components/ui/card';
import SearchInput from '@/components/search-input';
import AvatarCard from '@/components/avatar-card';
import { Button } from '@/components/ui/button';
import { usePAW } from '@/context/paw-context';

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

export default function Page() {
    const [avatars, setAvatars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [currentSearchType, setCurrentSearchType] = useState('name');
    const [currentQuery, setCurrentQuery] = useState('');
    const [currentPlatforms, setCurrentPlatforms] = useState([]);
    const [currentOrderBy, setCurrentOrderBy] = useState('newest');
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [allItemsLoaded, setAllItemsLoaded] = useState(false);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
    const [gridColumns, setGridColumns] = useState(3);
    const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
    const [privacyCheckComplete, setPrivacyCheckComplete] = useState(false);

    const pageRef = useRef(1);
    const containerRef = useRef(null);
    const loadingRef = useRef(null);
    const isLoadingMoreRef = useRef(false);
    const scrollListenerRef = useRef(null);
    const resizeObserverRef = useRef(null);

    const { fetchStats, searchAvatars } = usePAW();
    const { lang, t } = useLanguage();

    useEffect(() => {
        const checkPrivacyNotice = async () => {
            try {
                const hasSeenNotice = localStorage.getItem('privacy-notice-seen');

                if (!hasSeenNotice) setShowPrivacyDialog(true);
            } catch (error) {
                setShowPrivacyDialog(true);
            } finally {
                setPrivacyCheckComplete(true);
            }
        };

        checkPrivacyNotice();
    }, []);

    const handlePrivacyAccept = async () => {
        try {
            localStorage.setItem('privacy-notice-seen', 'true');
            setShowPrivacyDialog(false);
        } catch (error) {
            setShowPrivacyDialog(false);
        }
    };

    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        const calculateGridColumns = () => {
            if (!container) return;

            const containerWidth = container.clientWidth;
            const columns = Math.max(1, Math.floor((containerWidth + GRID_GAP) / (AVATAR_CARD_WIDTH + GRID_GAP)));

            setGridColumns(columns);
        };

        const handleScroll = () => {
            if (!hasSearched) return;
            
            const scrollTop = window.scrollY;
            const containerTop = container.getBoundingClientRect().top + window.scrollY;
            const relativeScrollTop = Math.max(0, scrollTop - containerTop);
            
            const rowHeight = AVATAR_CARD_HEIGHT + GRID_GAP;
            
            const buffer = 5;
            const visibleWindowHeight = window.innerHeight;
            
            const startRow = Math.max(0, Math.floor(relativeScrollTop / rowHeight) - buffer);
            const endRow = Math.ceil((relativeScrollTop + visibleWindowHeight) / rowHeight) + buffer;
            
            const startIndex = startRow * gridColumns;
            const endIndex = Math.min(avatars.length, endRow * gridColumns);
            
            setVisibleRange({ start: startIndex, end: endIndex });
            
            const loadingElement = loadingRef.current;
            
            if (loadingElement && hasNextPage && !loading && !isLoadingMoreRef.current && loadingElement.getBoundingClientRect().top < window.innerHeight + 500) fetchAvatars();
        };

        resizeObserverRef.current = new ResizeObserver(() => {
            calculateGridColumns();
            handleScroll();
        });
        
        resizeObserverRef.current.observe(container);
        
        scrollListenerRef.current = handleScroll;

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        calculateGridColumns();
        handleScroll();
        
        return () => {
            window.removeEventListener('scroll', handleScroll);

            if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
        };
    }, [hasSearched, loading, hasNextPage, avatars.length, gridColumns]);

    const getStats = async () => {
        setStatsLoading(true);

        try {
            const response = await fetchStats();

            response.success ? setStats(response.stats) : toast.error(lang.MainPage.StatsLoadingFailed);
        } catch (e) {
            toast.error(lang.MainPage.StatsLoadingFailed);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        getStats();
    }, []);

    const fetchAvatars = useCallback(async () => {
        if (loading || !hasNextPage || isLoadingMoreRef.current) return;

        isLoadingMoreRef.current = true;
        setLoading(true);

        try {
            const response = await searchAvatars(currentSearchType, currentQuery, currentPlatforms.join(','), pageRef, currentOrderBy);

            if (!response?.success || !response.data?.success) {
                toast.error(lang.MainPage.AvatarFetchingFailed);
                setHasNextPage(false);
                setAllItemsLoaded(true);
                return;
            }

            setAvatars(prev => [...prev, ...response.data.results]);
            setHasNextPage(response.data.pagination.hasNextPage);
            setTotalItems(response.data.pagination.totalCount);
            setAllItemsLoaded(!response.data.pagination.hasNextPage);

            pageRef.current += 1;
        } catch (e) {
            toast.error(lang.MainPage.AvatarFetchingFailed);
            setHasNextPage(false);
            setAllItemsLoaded(true);
        } finally {
            setLoading(false);
            isLoadingMoreRef.current = false;
        }
    }, [loading, hasNextPage, currentSearchType, currentQuery, currentPlatforms, currentOrderBy]);

    const handleSearch = (type, query, platforms, orderBy) => {
        if (!query.trim()) return;

        setAvatars([]);
        setCurrentSearchType(type);
        setCurrentQuery(query);
        setCurrentPlatforms(platforms);
        setCurrentOrderBy(orderBy);
        setHasNextPage(true);
        setTotalItems(0);
        setVisibleRange({ start: 0, end: 20 });

        pageRef.current = 1;

        setHasSearched(true);
        setAllItemsLoaded(false);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        if (hasSearched) fetchAvatars();
    }, [hasSearched, fetchAvatars]);

    const getTotalHeight = () => {
        const rowCount = Math.ceil(avatars.length / gridColumns);
        return rowCount * (AVATAR_CARD_HEIGHT + GRID_GAP);
    };

    const getVisibleAvatars = () => {
        return avatars.slice(visibleRange.start, visibleRange.end);
    };

    const getAvatarPosition = (index) => {
        const adjustedIndex = index + visibleRange.start;
        const row = Math.floor(adjustedIndex / gridColumns);
        const column = adjustedIndex % gridColumns;
        
        const top = row * (AVATAR_CARD_HEIGHT + GRID_GAP);
        const left = `${(column * (100 / gridColumns))}%`;
        
        return { top, left, width: `calc(${100 / gridColumns}% - ${GRID_GAP}px)` };
    };

    let total;

    if (stats) total = Array.from({ length: 10 }, (_, i) => i + 1) .reduce((sum, p) => sum + (stats.queue.priority[p] || 0), 0);

    return (
        <div>
            <UpdateTitle />

            <Dialog open={showPrivacyDialog && privacyCheckComplete} onOpenChange={setShowPrivacyDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <Shield className="h-6 w-6 text-primary" />
                            {lang.Privacy.Title}
                        </DialogTitle>
                        <DialogDescription className="text-base pt-4">
                            {lang.Privacy.Description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex gap-3">
                            <Eye className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold mb-1">{lang.Privacy.LocalScanning}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {lang.Privacy.LocalScanningDesc}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Lock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold mb-1">{lang.Privacy.DataStorage}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {lang.Privacy.DataStorageDesc}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold mb-1">{lang.Privacy.PrivacyFirst}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {lang.Privacy.PrivacyFirstDesc}
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handlePrivacyAccept} className="w-full">
                            {lang.Privacy.Understand}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <h1 className="text-4xl font-bold mb-8 text-center">{lang.MainPage.Header}</h1>
            <p className="text-center mb-8">{lang.MainPage.Subheader}</p>

            <div className="container mx-auto px-4 py-8" ref={containerRef}>
                {statsLoading ? (
                    <div className="flex justify-center items-center h-16">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    stats && (
                        <Card className="mb-6">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold">{Number(stats.users).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                                        <p className="text-sm text-gray-500">{lang.MainPage.Users}</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{Number(stats.avatars).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                                        <p className="text-sm text-gray-500">{lang.MainPage.Avatars}</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {total.toLocaleString('en-US', {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-500">{lang.MainPage.AvatarsQueued}</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{Number(stats.queue.active).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                                        <p className="text-sm text-gray-500">{lang.MainPage.AvatarsProcessing}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                )}

                <SearchInput onSearch={handleSearch} />
                <br />
                {!loading && hasSearched && avatars.length === 0 && (
                    <div className="text-center mb-4">{lang.MainPage.AvatarsNotFound}</div>
                )}
                {!loading && !hasSearched && (
                    <div className="text-center mb-4">{lang.MainPage.SearchText}</div>
                )}

                {hasSearched && (
                    <div className="relative">
                        <div style={{ height: getTotalHeight() + 100 }}></div>
                        
                        <div className="absolute top-0 left-0 w-full">
                            {getVisibleAvatars().map((avatar, index) => {
                                const position = getAvatarPosition(index);
                                
                                return (
                                    <div 
                                        key={avatar.id || index + visibleRange.start} 
                                        className="absolute"
                                        style={{
                                            top: position.top,
                                            left: position.left,
                                            width: position.width,
                                            height: AVATAR_CARD_HEIGHT,
                                            padding: `0 ${GRID_GAP/2}px ${GRID_GAP}px 0`
                                        }}
                                    >
                                        <AvatarCard avatar={avatar} />
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div 
                            ref={loadingRef} 
                            className="loading-indicator w-full text-center py-8"
                            style={{ 
                                position: 'absolute',
                                top: getTotalHeight()
                            }}
                        >
                            {loading ? (
                                <Loader2 className="h-8 w-8 animate-spin inline-block" />
                            ) : !allItemsLoaded ? (
                                <div className="text-gray-400">{lang.MainPage.LoadingMoreResults}</div>
                            ) : (
                                <div className="text-gray-400">{t('MainPage.ResultsEnd', lang, { count: avatars.length })}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const UpdateTitle = () => {
    try {
        if (typeof window === 'undefined') return null;

        const { lang } = useLanguage();
      
        import('@tauri-apps/api/window').then((tauri) => {
            tauri.getCurrentWindow().setTitle(lang.MainPage.Title);
        });
    } catch (error) {}
    
    return null;
};