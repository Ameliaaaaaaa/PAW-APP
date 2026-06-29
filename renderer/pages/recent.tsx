'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

import AvatarCard from '@/components/AvatarCard';

const AVATAR_CARD_WIDTH = 320;
const AVATAR_CARD_HEIGHT = 590;
const GRID_GAP = 20;
const BATCH_SIZE = 12;

type SortOrder = 'last_seen' | 'first_seen';

export default function Page(): JSX.Element {
    const [sortOrder, setSortOrder] = useState<SortOrder>('last_seen');
    const [avatarIds, setAvatarIds] = useState<string[]>([]);
    const [avatarData, setAvatarData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gridColumns, setGridColumns] = useState(3);
    const [allAvatarsLoaded, setAllAvatarsLoaded] = useState(false);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

    const containerRef: any = useRef<HTMLDivElement>(null);
    const loadingRef: any = useRef<HTMLDivElement>(null);
    const fetchingRef: any = useRef(false);
    const resizeObserverRef: any = useRef<ResizeObserver | null>(null);
    const avatarDataLengthRef: any = useRef(0);

    useEffect((): void => {
        avatarDataLengthRef.current = Object.keys(avatarData).length;
    }, [avatarData]);

    const calculateGridColumns: () => void = useCallback((): void => {
        if (!containerRef.current) return;

        const containerWidth: any = containerRef.current.clientWidth;
        const columns: number = Math.max(1, Math.floor((containerWidth + GRID_GAP) / (AVATAR_CARD_WIDTH + GRID_GAP)));

        setGridColumns(columns);
    }, []);

    const loadNextBatch: any = useCallback((ids: string[], batch: number, loaded: boolean): string[] | undefined => {
        if (fetchingRef.current || loaded) return undefined;

        const startIndex: number = batch * BATCH_SIZE;

        if (startIndex >= ids.length) return undefined;

        return ids.slice(startIndex, Math.min(startIndex + BATCH_SIZE, ids.length));
    }, []);

    const fetchAvatarBatch: any = useCallback(async (batchIds: string[], totalIds: number): Promise<void> => {
        if (fetchingRef.current || !batchIds.length) return;

        fetchingRef.current = true;

        setLoading(true);

        try {
            const results: any[] = await Promise.all(batchIds.map(async (avatarId: string): Promise<void> => {
                try {
                    const response: any = await window.electron.PAW.fetchAvatar(avatarId);

                    return response.success && response.result ? { id: avatarId, ...response.result } : null;
                } catch {
                    return null;
                }
            }));

            const newAvatarData: Record<string, any> = results.reduce((acc: any, avatar: any): any => {
                if (avatar) acc[avatar.id] = avatar;

                return acc;
            }, {} as Record<string, any>);

            setAvatarData((prev: any): any => {
                const merged = { ...prev, ...newAvatarData };

                if (Object.keys(merged).length >= totalIds) setAllAvatarsLoaded(true);

                return merged;
            });

            setCurrentBatch((prev: number): number => prev + 1);
        } catch (error) {
            setError('Failed to load avatar data.');
        } finally {
            setLoading(false);

            fetchingRef.current = false;
        }
    }, []);

    useEffect((): () => void => {
        const container: any = containerRef.current;

        if (!container) return;

        const handleScroll: () => void = (): void => {
            const scrollTop: number = window.scrollY;
            const containerTop: any = container.getBoundingClientRect().top + window.scrollY;
            const relativeScrollTop: number = Math.max(0, scrollTop - containerTop);

            const rowHeight: number = AVATAR_CARD_HEIGHT + GRID_GAP;
            const buffer = 5;

            const startRow: number = Math.max(0, Math.floor(relativeScrollTop / rowHeight) - buffer);
            const endRow: number = Math.ceil((relativeScrollTop + window.innerHeight) / rowHeight) + buffer;

            const startIndex: number = startRow * gridColumns;
            const endIndex: number = Math.min(avatarDataLengthRef.current, endRow * gridColumns);

            setVisibleRange({ start: startIndex, end: endIndex });
        };

        resizeObserverRef.current = new ResizeObserver((): void => {
            calculateGridColumns();
            handleScroll();
        });

        resizeObserverRef.current.observe(container);

        window.addEventListener('scroll', handleScroll, {
            passive: true
        });

        calculateGridColumns();
        handleScroll();

        return (): void => {
            window.removeEventListener('scroll', handleScroll);
            resizeObserverRef.current?.disconnect();
        };
    }, [gridColumns, calculateGridColumns]);

    useEffect((): () => void => {
        if (!loadingRef.current || allAvatarsLoaded || loading || !avatarIds.length) return;

        const observer = new IntersectionObserver((entries: any): void => {
            if (entries[0].isIntersecting && !fetchingRef.current && !allAvatarsLoaded) {
                const batchIds: any = loadNextBatch(avatarIds, currentBatch, allAvatarsLoaded);

                if (batchIds) fetchAvatarBatch(batchIds, avatarIds.length);
            }
        }, { rootMargin: '500px' });

        observer.observe(loadingRef.current);

        return (): void => observer.disconnect();
    }, [loading, allAvatarsLoaded, avatarIds, currentBatch, loadNextBatch, fetchAvatarBatch]);

    useEffect((): void => {
        setAvatarIds([]);
        setAvatarData({});
        setCurrentBatch(0);
        setAllAvatarsLoaded(false);

        setVisibleRange({
            start: 0,
            end: 20
        });

        fetchingRef.current = false;

        const fetchAvatarIds: () => Promise<void> = async (): Promise<void> => {
            try {
                const rows: { avatar_id: string; first_seen: string; last_seen: string }[] = await window.electron.Database.getSeenAvatars(sortOrder);

                setAvatarIds(rows.map((row: any): string => row.avatar_id));
            } catch {
                setError('Failed to load recent avatar IDs.');
                setLoading(false);
            }
        };

        fetchAvatarIds();
    }, [sortOrder]);

    useEffect((): void => {
        if (avatarIds.length > 0 && currentBatch === 0 && !fetchingRef.current) {
            const batchIds: any = loadNextBatch(avatarIds, 0, false);

            if (batchIds) fetchAvatarBatch(batchIds, avatarIds.length);
        }
    }, [avatarIds, currentBatch, loadNextBatch, fetchAvatarBatch]);

    const getTotalHeight: () => number = (): number => {
        const rowCount: number = Math.ceil(Object.keys(avatarData).length / gridColumns);

        return rowCount * (AVATAR_CARD_HEIGHT + GRID_GAP);
    };

    const getVisibleAvatars: () => any[] = (): any[] => Object.values(avatarData).slice(visibleRange.start, visibleRange.end);

    const getAvatarPosition: any = (index: number): any => {
        const adjustedIndex: number = index + visibleRange.start;
        const row: number = Math.floor(adjustedIndex / gridColumns);
        const column: number = adjustedIndex % gridColumns;

        return {
            top: row * (AVATAR_CARD_HEIGHT + GRID_GAP),
            left: `${column * (100 / gridColumns)}%`,
            width: `calc(${100 / gridColumns}% - ${GRID_GAP}px)`
        };
    };

    if (error) return <div className="text-center text-red-500 p-4"><p>{error}</p></div>;

    return (
        <div>
            <div className="container mx-auto px-4 py-8" ref={containerRef}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Recently Seen</h1>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Sort by</span>
                        <div className="flex rounded-md overflow-hidden border border-border">
                            <button
                                onClick={() => setSortOrder('last_seen')}
                                className={`px-3 py-1.5 text-sm transition-colors ${sortOrder === 'last_seen' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}
                            >
                                Last Seen
                            </button>
                            <button
                                onClick={() => setSortOrder('first_seen')}
                                className={`px-3 py-1.5 text-sm transition-colors border-l border-border ${sortOrder === 'first_seen' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}
                            >
                                First Seen
                            </button>
                        </div>
                    </div>
                </div>

                {!loading && avatarIds.length === 0 ? (
                    <div className="text-center text-muted-foreground p-4">
                        <p>No recently seen avatars found. Join a world with avatars enabled to see recently seen avatars.</p>
                    </div>
                ) : (
                    <div className="relative">
                        <div style={{ height: getTotalHeight() + 100 }} />

                        <div className="absolute top-0 left-0 w-full">
                            {getVisibleAvatars().map((avatar: any, index: number): JSX.Element => {
                                const position: any = getAvatarPosition(index);

                                return (
                                    <div key={avatar.id} className="absolute" style={{top: position.top, left: position.left, width: position.width, height: AVATAR_CARD_HEIGHT, padding: `0 ${GRID_GAP / 2}px ${GRID_GAP}px 0`}}>
                                        <AvatarCard avatar={avatar} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div ref={loadingRef} className="w-full text-center py-8" style={{ position: 'relative' }}>
                    {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin inline-block" />
                    ) : allAvatarsLoaded ? (
                        <div className="text-gray-400">
                            All avatars loaded • {Object.keys(avatarData).length} avatars found
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}