'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { error as err } from '@tauri-apps/plugin-log';
import { Loader2 } from 'lucide-react';

import { useCacheScanner } from '@/context/cache-scanner-context';
import AvatarCard from '@/components/avatar-card';
import { usePAW } from '@/context/paw-context';

const AVATAR_CARD_WIDTH = 320;
const AVATAR_CARD_HEIGHT = 590;
const GRID_GAP = 20;
const BATCH_SIZE = 12;

export default function Page() {
    const [avatarIds, setAvatarIds] = useState([]);
    const [avatarData, setAvatarData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gridColumns, setGridColumns] = useState(3);
    const [allAvatarsLoaded, setAllAvatarsLoaded] = useState(false);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

    const containerRef = useRef(null);
    const loadingRef = useRef(null);
    const fetchingRef = useRef(false);
    const scrollListenerRef = useRef(null);
    const resizeObserverRef = useRef(null);

    const { processedIds } = useCacheScanner();
    const { fetchAvatar } = usePAW();

    const calculateGridColumns = useCallback(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.clientWidth;
        const columns = Math.max(1, Math.floor((containerWidth + GRID_GAP) / (AVATAR_CARD_WIDTH + GRID_GAP)));

        setGridColumns(columns);
    }, []);

    const loadNextBatch = useCallback(() => {
        if (fetchingRef.current || allAvatarsLoaded) return;

        const startIndex = currentBatch * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, avatarIds.length);

        if (startIndex >= avatarIds.length) {
            setAllAvatarsLoaded(true);

            return;
        }

        const newBatchIds = avatarIds.slice(startIndex, endIndex);

        setCurrentBatch((prev) => prev + 1);

        return newBatchIds;
    }, [avatarIds, currentBatch, allAvatarsLoaded]);

    const fetchAvatarBatch = async (batchIds) => {
        if (fetchingRef.current || !batchIds || batchIds.length === 0) return;

        fetchingRef.current = true;
        setLoading(true);

        try {
            const avatarPromises = batchIds.map(async (avatarId) => {
                try {
                    const response = await fetchAvatar(avatarId);
                    
                    if (!response.success) {
                        err(`Failed to fetch avatar ${avatarId}: ${response.status}`);

                        return null;
                    }
                    
                    return response.success && response.result ? { id: avatarId, ...response.result } : null;
                } catch (e) {
                    err(`Error fetching avatar ${avatarId}:`, e);

                    return null;
                }
            });

            const results = await Promise.all(avatarPromises);

            const newAvatarData = results.reduce((acc, avatar) => {
                if (avatar) acc[avatar.id] = avatar;

                return acc;
            }, {});
            
            setAvatarData((prevData) => ({ ...prevData, ...newAvatarData }));

            if (Object.keys(avatarData).length + Object.keys(newAvatarData).length >= avatarIds.length) setAllAvatarsLoaded(true);
        } catch (e) {
            err('Error fetching avatar batch:', e);
            setError('Failed to load avatar data');
        } finally {
            setLoading(false);

            fetchingRef.current = false;
        }
    };

    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const containerTop = container.getBoundingClientRect().top + window.scrollY;
            const relativeScrollTop = Math.max(0, scrollTop - containerTop);
            
            const rowHeight = AVATAR_CARD_HEIGHT + GRID_GAP;
            const buffer = 5;
            const visibleWindowHeight = window.innerHeight;
            
            const startRow = Math.max(0, Math.floor(relativeScrollTop / rowHeight) - buffer);
            const endRow = Math.ceil((relativeScrollTop + visibleWindowHeight) / rowHeight) + buffer;
            
            const startIndex = startRow * gridColumns;
            const endIndex = Math.min(Object.keys(avatarData).length, endRow * gridColumns);
            
            setVisibleRange({ start: startIndex, end: endIndex });
            
            const loadingElement = loadingRef.current;

            if (loadingElement && !allAvatarsLoaded && !loading && !fetchingRef.current && loadingElement.getBoundingClientRect().top < window.innerHeight + 500) {
                const batchIds = loadNextBatch();

                if (batchIds) fetchAvatarBatch(batchIds);
            }
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
    }, [loading, allAvatarsLoaded, gridColumns, calculateGridColumns, loadNextBatch, avatarData]);

    useEffect(() => {
        const fetchAvatarIds = async () => {
            try {
                const recentAvatars = [...processedIds].reverse();
                
                setAvatarIds(recentAvatars);
            } catch (e) {
                err('Error fetching recent avatars:', e);
                setError('Failed to load recent avatar IDs');
                setLoading(false);
            }
        };

        fetchAvatarIds();
    }, [processedIds]);

    useEffect(() => {
        if (avatarIds.length > 0 && currentBatch === 0) {
            const batchIds = loadNextBatch();

            if (batchIds) fetchAvatarBatch(batchIds);
        }
    }, [avatarIds, loadNextBatch, currentBatch]);

    const getTotalHeight = () => {
        const totalAvatars = Object.keys(avatarData).length;
        const rowCount = Math.ceil(totalAvatars / gridColumns);

        return rowCount * (AVATAR_CARD_HEIGHT + GRID_GAP);
    };

    const getVisibleAvatars = () => {
        const avatarEntries = Object.entries(avatarData);

        return avatarEntries.slice(visibleRange.start, visibleRange.end).map(([_, avatar]) => avatar);
    };

    const getAvatarPosition = (index) => {
        const adjustedIndex = index + visibleRange.start;
        const row = Math.floor(adjustedIndex / gridColumns);
        const column = adjustedIndex % gridColumns;
        
        const top = row * (AVATAR_CARD_HEIGHT + GRID_GAP);
        const left = `${(column * (100 / gridColumns))}%`;
        
        return { 
            top, 
            left, 
            width: `calc(${100 / gridColumns}% - ${GRID_GAP}px)` 
        };
    };

    if (error) return (<div className="text-center text-red-500 p-4"><p>{error}</p></div>);
    
  return (
    <div>
        <UpdateTitle />
        
        <div className="container mx-auto px-4 py-8" ref={containerRef}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Recently Seen</h1>
            </div>

            {avatarIds.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">
                    <p>No recently seen avatars found. Join a world with avatars enabled to see recently seen avatars.</p>
                </div>
            ) : (
                <div className="relative">
                    <div style={{ height: getTotalHeight() + 100 }}></div>
                    
                    <div className="absolute top-0 left-0 w-full">
                        {getVisibleAvatars().map((avatar, index) => {
                            const position = getAvatarPosition(index);
                            
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

const UpdateTitle = () => {
    try {
        if (typeof window === 'undefined') return null;

        import('@tauri-apps/api/window').then((tauri) => {
            tauri.getCurrentWindow().setTitle('PAW ~ Recently Seen Avatars');
        });
    } catch (error) {};
  
    return null;
};