'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import AvatarCard from '@/components/AvatarCard';
import { Button } from '@/components/ui/button';

const AVATAR_CARD_WIDTH = 320;
const AVATAR_CARD_HEIGHT = 590;
const GRID_GAP = 20;
const BATCH_SIZE = 12;

const ORDER_OPTIONS: ({ label: string; value: string })[] = [
    { label: 'Recently Added', value: 'added' },
    { label: 'Recently Updated', value: 'updated' },
    { label: 'Recently Checked', value: 'checked' }
];

export default function Page(): JSX.Element {
    const [avatarIds, setAvatarIds] = useState([]);
    const [avatarData, setAvatarData] = useState({});
    const [loading, setLoading] = useState(true);
    const [gridColumns, setGridColumns] = useState(3);
    const [allAvatarsLoaded, setAllAvatarsLoaded] = useState(false);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
    const [orderBy, setOrderBy] = useState('added');

    const containerRef: any = useRef(null);
    const loadingRef: any = useRef(null);
    const fetchingRef: any = useRef(false);
    const scrollListenerRef: any = useRef(null);
    const resizeObserverRef: any = useRef(null);

    const calculateGridColumns: () => void = useCallback((): void => {
        if (!containerRef.current) return;

        const containerWidth: any = containerRef.current.clientWidth;
        const columns: number = Math.max(1, Math.floor((containerWidth + GRID_GAP) / (AVATAR_CARD_WIDTH + GRID_GAP)));

        setGridColumns(columns);
    }, []);

    const loadNextBatch: () => any[] = useCallback((): any[] => {
        if (fetchingRef.current || allAvatarsLoaded) return;

        const startIndex: number = currentBatch * BATCH_SIZE;
        const endIndex: number = Math.min(startIndex + BATCH_SIZE, avatarIds.length);

        if (startIndex >= avatarIds.length) {
            setAllAvatarsLoaded(true);

            return;
        }

        const newBatchIds: any[] = avatarIds.slice(startIndex, endIndex);

        setCurrentBatch((prev: number): number => prev + 1);

        return newBatchIds;
    }, [avatarIds, currentBatch, allAvatarsLoaded]);

    const fetchAvatarBatch: any = async (batchIds: any): Promise<void> => {
        if (fetchingRef.current || !batchIds || batchIds.length === 0) return;

        fetchingRef.current = true;

        setLoading(true);

        try {
            const avatarPromises: any = batchIds.map(async (avatarId: any): Promise<any> => {
                try {
                    const response: any = await window.electron.PAW.fetchAvatar(avatarId);

                    if (!response.success) {
                        toast.error(`Failed to fetch avatar ${avatarId}.`);

                        return null;
                    }

                    return response.success && response.result ? { id: avatarId, ...response.result } : null;
                } catch (e) {
                    toast.error(`Failed to fetch avatar ${avatarId}.`);

                    return null;
                }
            });

            const results: any[] = await Promise.all(avatarPromises);

            const newAvatarData: any = results.reduce((acc: any, avatar: any): any => {
                if (avatar) acc[avatar.id] = avatar;

                return acc;
            }, {});

            setAvatarData((prevData: {}): any => ({ ...prevData, ...newAvatarData }));

            if (Object.keys(avatarData).length + Object.keys(newAvatarData).length >= avatarIds.length) setAllAvatarsLoaded(true);
        } catch (e) {
            toast.error('Failed to load avatar data.');
        } finally {
            setLoading(false);

            fetchingRef.current = false;
        }
    };

    useEffect((): () => void => {
        const container: any = containerRef.current;

        if (!container) return;

        const handleScroll: () => void = (): void => {
            const scrollTop: number = window.scrollY;
            const containerTop: any = container.getBoundingClientRect().top + window.scrollY;
            const relativeScrollTop: number = Math.max(0, scrollTop - containerTop);

            const rowHeight: number = AVATAR_CARD_HEIGHT + GRID_GAP;
            const buffer = 5;
            const visibleWindowHeight: number = window.innerHeight;

            const startRow: number = Math.max(0, Math.floor(relativeScrollTop / rowHeight) - buffer);
            const endRow: number = Math.ceil((relativeScrollTop + visibleWindowHeight) / rowHeight) + buffer;

            const startIndex: number = startRow * gridColumns;
            const endIndex: number = Math.min(Object.keys(avatarData).length, endRow * gridColumns);

            setVisibleRange({
                start: startIndex,
                end: endIndex
            });

            const loadingElement: any = loadingRef.current;

            if (loadingElement && !allAvatarsLoaded && !loading && !fetchingRef.current && loadingElement.getBoundingClientRect().top < window.innerHeight + 500) {
                const batchIds: any[] = loadNextBatch();

                if (batchIds) fetchAvatarBatch(batchIds);
            }
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
    }, [loading, allAvatarsLoaded, gridColumns, calculateGridColumns, loadNextBatch, avatarData]);

    useEffect((): void => {
        const fetchAvatarIds: () => Promise<void> = async (): Promise<void> => {
            try {
                setLoading(true);

                const response: any = await window.electron.PAW.fetchRecentAvatars(orderBy);

                if (!response.success) toast.error('Failed to load recent avatar IDs.');

                setAvatarIds(response.results.map((avatar: any): any => avatar.id));
                setAvatarData({});
                setCurrentBatch(0);
                setAllAvatarsLoaded(false);
            } catch (e) {
                toast.error('Failed to load recent avatar IDs.');
            } finally {
                setLoading(false);
            }
        };

        fetchAvatarIds();
    }, [orderBy]);

    useEffect((): void => {
        if (avatarIds.length > 0 && currentBatch === 0) {
            const batchIds: any[] = loadNextBatch();

            if (batchIds) fetchAvatarBatch(batchIds);
        }
    }, [avatarIds, loadNextBatch, currentBatch]);

    const getTotalHeight: () => number = (): number => {
        const totalAvatars: number = Object.keys(avatarData).length;
        const rowCount: number = Math.ceil(totalAvatars / gridColumns);

        return rowCount * (AVATAR_CARD_HEIGHT + GRID_GAP);
    };

    const getVisibleAvatars: () => unknown = (): unknown[] => {
        const avatarEntries: [string, unknown][] = Object.entries(avatarData);

        return avatarEntries.slice(visibleRange.start, visibleRange.end).map(([_, avatar]: [ string, unknown]): unknown => avatar);
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

    return (
        <div>
            <div className="container mx-auto px-4 py-8" ref={containerRef}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Database Updates</h1>
                    <div className="flex gap-2">
                        {ORDER_OPTIONS.map((option: any): JSX.Element => (
                            <Button key={option.value} variant={orderBy === option.value ? "default" : "outline"} onClick={(): void => setOrderBy(option.value)}>
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {avatarIds.length === 0 ? (
                    <div className="text-center text-muted-foreground p-4">
                        <p>No recent avatars found.</p>
                    </div>
                ) : (
                    <div className="relative">
                        <div style={{ height: getTotalHeight() + 100 }}></div>

                        <div className="absolute top-0 left-0 w-full">
                            {getVisibleAvatars().map((avatar: unknown, index: number): JSX.Element => {
                                const position: any = getAvatarPosition(index);

                                return (
                                    <div key={avatar.id} className="absolute" style={{
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
                    </div>
                )}

                <div ref={loadingRef} className="loading-indicator w-full text-center py-8" style={{
                    position: 'relative',
                    top: allAvatarsLoaded ? 'auto' : '0'
                }}>
                    {loading && !allAvatarsLoaded ? (
                        <Loader2 className="h-8 w-8 animate-spin inline-block" />
                    ) : allAvatarsLoaded ? (
                        <div className="text-gray-400">All avatars loaded • {Object.keys(avatarData).length} avatars found</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};