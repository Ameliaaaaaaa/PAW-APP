'use client';

import { readDir, stat, watchImmediate, readFile } from '@tauri-apps/plugin-fs';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as path from '@tauri-apps/api/path';

import { useCacheScanner } from '@/context/cache-scanner-context';

const LogScannerContext = createContext(null);

const worldJoinRegex = /(\d{4}\.\d{2}\.\d{2}\s\d{2}:\d{2}:\d{2})\s+Debug\s+-\s+\[Behaviour\]\s+Joining\s+(wrld_[^:]+):(\d+)~([^(]*)(?:\(([^)]+)\))?~region\(([^)]+)\)/;
const worldLeaveRegex = /(\d{4}\.\d{2}\.\d{2}\s\d{2}:\d{2}:\d{2})\s+Debug\s+-\s+\[Behaviour\]\s+Unloading\s+scenes\s+for\s+leaving\s+world/;

const playerJoinRegex = /(\d{4}\.\d{2}\.\d{2}\s\d{2}:\d{2}:\d{2})\s+Debug\s+-\s+\[Behaviour\]\s+OnPlayerJoined\s+([^\s]+)\s+\(([^)]+)\)/g;
const playerLeftRegex = /(\d{4}\.\d{2}\.\d{2}\s\d{2}:\d{2}:\d{2})\s+Debug\s+-\s+\[Behaviour\]\s+OnPlayerLeft\s+([^\s]+)\s+\(([^)]+)\)/;

const avatarIdRegex = /\bavtr_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g;

const getLatestLogFile = async () => {
    const files = (await readDir(`${await path.homeDir()}/AppData/LocalLow/VRChat/VRChat`)).filter(file => file.name.startsWith('output_log_'));

    const logFilesWithStats = await Promise.all(files.map(async (file) => {
        const stats = await stat(`${await path.homeDir()}/AppData/LocalLow/VRChat/VRChat/${file.name}`);

        return {
            filename: file.name,
            createdAt: stats.mtime.getTime()
        };
    }));

    const sortedLogFiles = logFilesWithStats.sort((a, b) => b.createdAt - a.createdAt);

    return `${await path.homeDir()}/AppData/LocalLow/VRChat/VRChat/${sortedLogFiles[0].filename}`;
};

const handleNewLines = (lines, setPlayers, setCurrentWorld, addToPendingIds) => {
    for (const line of lines) {
        const playerJoinMatch = playerJoinRegex.exec(line);
        const playerLeftMatch = playerLeftRegex.exec(line);
        const worldMatch = worldJoinRegex.exec(line);
        const worldLeaveMatch = worldLeaveRegex.exec(line);
        const avatarIdMatches = line.match(avatarIdRegex);

        if (avatarIdMatches) addToPendingIds(avatarIdMatches);

        if (playerJoinMatch) {
            const playerName = playerJoinMatch[2];
            const userId = playerJoinMatch[3];
        
            setPlayers(prev => {
                const existingPlayerIndex = prev.findIndex(p => p?.userId === userId);
        
                if (existingPlayerIndex === -1) return [...prev, {
                    playerName,
                    userId
                }];
        
                return prev;
            });
        
            playerJoinRegex.lastIndex = 0;
        }

        if (playerLeftMatch) {
            const userId = playerLeftMatch[3];

            setPlayers(prev => {
                const playerIndex = prev.findIndex(p => p?.userId === userId);

                if (playerIndex >= 0) {
                    const updatedPlayers = [...prev];

                    delete updatedPlayers[playerIndex];

                    return updatedPlayers;
                }
                
                return prev;
            });
        }

        if (worldMatch) {
            const worldId = worldMatch[2];
            const instanceId = worldMatch[3];

            setCurrentWorld({
                worldId,
                instanceId
            });
            
            setPlayers([]);
        }
      
        if (worldLeaveMatch) {
            setCurrentWorld(null);
            setPlayers([]);
        }
    }
};

export function LogScannerProvider({ children }) {
    const [currentWorld, setCurrentWorld] = useState(null);
    const [players, setPlayers] = useState([]);
    const filePathRef = useRef('');
    const offsetRef = useRef(0);

    const { addToPendingIds } = useCacheScanner();

    useEffect(() => {
        const decoder = new TextDecoder();

        const readNewData = async () => {
            const filePath = filePathRef.current;

            const fileStat = await stat(filePath);

            const fileSize = fileStat.size;
        
            if (fileSize > offsetRef.current) {
                const length = fileSize - offsetRef.current;

                const binaryData = await readFile(filePath, {
                    cursor: offsetRef.current,
                    length
                });

                const text = decoder.decode(new Uint8Array(binaryData));
                const newLines = text.split('\n').filter((line) => line.trim() !== '');

                offsetRef.current = fileSize;

                handleNewLines(newLines, setPlayers, setCurrentWorld, addToPendingIds);
            }
        };

        const watchLog = async () => {
            const filePath = await getLatestLogFile();

            filePathRef.current = filePath;

            const statInfo = await stat(filePath);

            offsetRef.current = statInfo.size;

            await watchImmediate(filePath, async () => {
                await readNewData();
            });
        };

        watchLog();
    }, []);

    const getPlayers = () => {
        return players;
    };

    return (
        <LogScannerContext.Provider
        value={{
            getPlayers
        }}
        >
            {children}
        </LogScannerContext.Provider>
    );
};

export function useLogScanner() {
    const context = useContext(LogScannerContext);
  
    if (!context) throw new Error('useLogScanner must be used within a LogScannerProvider');
    
    return context;
};