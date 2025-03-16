'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { error as err } from '@tauri-apps/plugin-log';
import { invoke } from '@tauri-apps/api/core';
import { Loader2 } from 'lucide-react';

import AvatarCard from '@/components/avatar-card';
import { usePAW } from '@/context/paw-context';

const AVATAR_CARD_WIDTH = 320;
const AVATAR_CARD_HEIGHT = 550;
const GRID_GAP = 20;

export default function RecentAvatarsGrid() {
  const [avatarIds, setAvatarIds] = useState([]);
  const [avatarData, setAvatarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridColumns, setGridColumns] = useState(3);
  const [allAvatarsLoaded, setAllAvatarsLoaded] = useState(false);

  const containerRef = useRef(null);
  const loadingRef = useRef(null);
  const fetchingRef = useRef(false);

  const calculateGridColumns = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const columns = Math.max(1, Math.floor((containerWidth + GRID_GAP) / (AVATAR_CARD_WIDTH + GRID_GAP)));

    setGridColumns(columns);
  }, []);

  const fetchAllAvatars = async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;

    setLoading(true);

    try {
      const batchIds = avatarIds;

      const avatarPromises = batchIds.map(async (avatarId) => {
        try {
          const response = await fetch(`https://paw-api.amelia.fun/avatar?avatarId=${avatarId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'PAW-APP/0.0.1'
            }
        });

          if (!response.ok) {
            err(`Failed to fetch avatar ${avatarId}: ${response.status}`);

            return null;
          }

          const data = await response.json();

          return data.success && data.result ? { id: avatarId, ...data.result } : null;
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

      setAllAvatarsLoaded(true);
    } catch (e) {
      err('Error fetching avatar batch:', e);
      setError('Failed to load avatar data');
    } finally {
      setLoading(false);

      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    const fetchAvatarIds = async () => {
      try {
        const recentAvatars = await invoke('get_successful_posts');

        setAvatarIds(recentAvatars);
      } catch (e) {
        err('Error fetching recent avatars:', e);
        setError('Failed to load recent avatar IDs');
        setLoading(false);
      }
    };

    fetchAvatarIds();
  }, []);

  useEffect(() => {
    if (avatarIds.length > 0) fetchAllAvatars();
  }, [avatarIds]);

  useEffect(() => {
    calculateGridColumns();
  }, [calculateGridColumns]);

  const getTotalHeight = () => {
    const rowCount = Math.ceil(avatarIds.length / gridColumns);

    return rowCount * (AVATAR_CARD_HEIGHT + GRID_GAP);
  };

  const getVisibleAvatars = () => {
    return avatarIds.map((id) => avatarData[id]).filter((avatar) => avatar);
  };

  const getAvatarPosition = (index) => {
    const row = Math.floor(index / gridColumns);
    const column = index % gridColumns;

    const top = row * (AVATAR_CARD_HEIGHT + GRID_GAP);
    const left = `${column * (100 / gridColumns)}%`;

    return { top, left, width: `calc(${100 / gridColumns}% - ${GRID_GAP}px)` };
  };

  if (error) return (
    <div className="text-center text-red-500 p-4">
      <p>{error}</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8" ref={containerRef}>
      {avatarIds.length === 0 ? (
        <div className="text-center text-muted-foreground p-4">
          <p>No recent avatars found.</p>
        </div>
      ) : (
        <div className="relative" style={{ height: getTotalHeight() }}>
          {getVisibleAvatars().map((avatar, index) => {
            const position = getAvatarPosition(index);

            return (
              <div
                key={avatar.id}
                className='absolute'
                style={{
                  top: position.top,
                  left: position.left,
                  width: position.width,
                  height: AVATAR_CARD_HEIGHT,
                  padding: `0 ${GRID_GAP / 2}px ${GRID_GAP}px 0`,
                }}
              >
                <AvatarCard avatar={avatar} />
              </div>
            );
          })}
        </div>
      )}
      <div ref={loadingRef} className="loading-indicator w-full text-center py-8">
        {loading && !allAvatarsLoaded ? (
          <Loader2 className="h-8 w-8 animate-spin inline-block" />
        ) : allAvatarsLoaded ? (
          <div className="text-gray-400">
            All avatars loaded • {Object.keys(avatarData).length} avatars found
          </div>
        ) : null}
      </div>
    </div>
  );
};