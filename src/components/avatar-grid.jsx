'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { error as err } from '@tauri-apps/plugin-log';
import { Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import SearchInput from '@/components/search-input';
import AvatarCard from '@/components/avatar-card';
import { usePAW } from '@/context/paw-context';

const AVATAR_CARD_WIDTH = 320;
const AVATAR_CARD_HEIGHT = 550;
const GRID_GAP = 20;

export default function AvatarGrid() {
    const [avatars, setAvatars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(null);
    const [currentSearchType, setCurrentSearchType] = useState('name');
    const [currentQuery, setCurrentQuery] = useState('');
    const [currentPlatforms, setCurrentPlatforms] = useState([]);
    const [currentOrderBy, setCurrentOrderBy] = useState('newest');
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [allItemsLoaded, setAllItemsLoaded] = useState(false);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
    const [gridColumns, setGridColumns] = useState(3);

    const pageRef = useRef(1);
    const containerRef = useRef(null);
    const loadingRef = useRef(null);
    const isLoadingMoreRef = useRef(false);
    const scrollListenerRef = useRef(null);
    const resizeObserverRef = useRef(null);

    const { fetchStats } = usePAW();

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
        setStatsError(null);

        const response = await fetchStats();
    
        if (response.success) {
            setStats(response.stats);
            setStatsLoading(false);
        } else {
            setStatsError('Failed to load stats.');
        }
    };

    useEffect(() => {
        getStats();
    }, []);

    const fetchAvatars = useCallback(async () => {
        if (loading || !hasNextPage || isLoadingMoreRef.current) return;

        isLoadingMoreRef.current = true;

        setLoading(true);
        setError(null);

        try {
            const endpoint = currentSearchType === 'ai' ? 'https://paw-api.amelia.fun/ai-search' : 'https://paw-api.amelia.fun/search';

            const response = await fetch(`${endpoint}?${new URLSearchParams({
                ...(currentSearchType === 'ai' ? { prompt: currentQuery } : {
                    type: currentSearchType,
                    query: currentQuery
                }),
                platforms: currentPlatforms.join(','),
                page: pageRef.current.toString(),
                order: currentOrderBy
            })}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'PAW-APP/0.0.1'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();

                throw new Error(`Failed to fetch avatars: ${response.status} ${response.statusText}\n${errorText}`);
            }

            const data = await response.json();

            if (data.success) {
                setAvatars((prev) => [...prev, ...data.results]);
                setHasNextPage(data.pagination.hasNextPage);
                setTotalItems(data.pagination.totalCount);
                setAllItemsLoaded(!data.pagination.hasNextPage);

                pageRef.current += 1;
            } else {
                throw new Error('API request was not successful.');
            }
        } catch (error) {
            setError(`An error occurred while fetching avatars: ${error.message}`);
            err(error);
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

    return (
        <div className="container mx-auto px-4 py-8" ref={containerRef}>
            {statsLoading ? (
                <div className="flex justify-center items-center h-16">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : statsError ? (
                <div className="text-red-500 text-center mb-4">{statsError}</div>
            ) : (
                stats && (
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold">{Number(stats.users).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                                    <p className="text-sm text-gray-500">Users</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{Number(stats.avatars).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                                    <p className="text-sm text-gray-500">Avatars</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            )}

            <SearchInput onSearch={handleSearch} />
            <br />
            {error && <div className="text-red-500 text-center mb-4">{error}</div>}
            {!loading && !error && hasSearched && avatars.length === 0 && (
                <div className="text-center mb-4">No avatars found. Try a different search term or platform combination.</div>
            )}
            {!loading && !error && !hasSearched && (
                <div className="text-center mb-4">Enter a search term to find VRChat avatars.</div>
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
                            <div className="text-gray-400">Loading more results...</div>
                        ) : (
                            <div className="text-gray-400">End of results • {avatars.length} avatars found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};