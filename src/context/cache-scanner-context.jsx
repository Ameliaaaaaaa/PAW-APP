'use client';

import { watchImmediate, BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';
import { createContext, useContext, useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { error } from '@tauri-apps/plugin-log';

const BASE_URL = 'https://paw-api.amelia.fun';
const MAX_CONCURRENT_REQUESTS = 3;

const CacheScannerContext = createContext(null);

export function CacheScannerProvider({ children }) {
    const [enabled, setEnabled] = useState(true);
    const [pendingIds, setPendingIds] = useState([]);
    const [processedIds, setProcessedIds] = useState([]);
    const [processingIds, setProcessingIds] = useState([]);
    const [activeRequests, setActiveRequests] = useState(0);
    const [currentVersion, setCurrentVersion] = useState('0.0.0');

    const processId = async (id) => {
        if (!id || processingIds.includes(id)) return;
        
        setProcessingIds(prev => [...prev, id]);
        setActiveRequests(prev => prev + 1);
        
        try {
            await sendToApi(id);

            if (!processedIds.includes(id)) setProcessedIds(prev => [...prev, id]);
            
            setPendingIds(prev => prev.filter(pendingId => pendingId !== id));
        } catch (e) {
            error(e);
        } finally {
            setProcessingIds(prev => prev.filter(processingId => processingId !== id));
            setActiveRequests(prev => prev - 1);
        }
    };

    const sendToApi = async (id) => {
        try {
            await fetch(`${BASE_URL}/update?avatarId=${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `PAW-APP/${currentVersion}`
                }
            });

            return true;
        } catch (e) {
            error(e);
        }
    };

    const addToPendingIds = (newIds) => {
        if (!newIds || newIds.length === 0) return;
        
        const uniqueNewIds = newIds.filter(id => !processedIds.includes(id) && !pendingIds.includes(id) && !processingIds.includes(id));
        
        if (uniqueNewIds.length > 0) setPendingIds(prev => [...prev, ...uniqueNewIds]);
    };

    useEffect(() => {
        const processNextBatch = async () => {
            if (activeRequests >= MAX_CONCURRENT_REQUESTS || pendingIds.length === 0) return;
            
            const availableSlots = MAX_CONCURRENT_REQUESTS - activeRequests;
            const idsToProcess = pendingIds.slice(0, availableSlots);
            
            idsToProcess.forEach(id => {
                processId(id);
            });
        };
        
        processNextBatch();
    }, [pendingIds, activeRequests, processingIds]);

    useEffect(() => {
        const watchAmplitude = async () => {
            setCurrentVersion(await getVersion());

            await watchImmediate('VRChat/VRChat', async (event) => {
                const path = event.paths[0];

                if (path.includes('amplitude.cache')) {
                    try {
                        const fileContent = await readTextFile(path);
                        const parsed = JSON.parse(fileContent);

                        if (parsed.length) {
                            if (parsed[0].event_properties.avatarIdsEncountered) addToPendingIds(parsed[0].event_properties.avatarIdsEncountered);
                        }
                    } catch (e) {
                        error(`Failed to parse amplitude cache: ${e}`);
                    }
                }
            }, {
                baseDir: BaseDirectory.Temp,
                recursive: true
            });

            setEnabled(true);
        };

        watchAmplitude();
    }, []);

    return (
        <CacheScannerContext.Provider
        value={{
            pendingCount: pendingIds.length,
            processingCount: processingIds.length,
            processedCount: processedIds.length,
            processedIds: processedIds
        }}
        >
            {children}
        </CacheScannerContext.Provider>
    );
};

export function useCacheScanner() {
    const context = useContext(CacheScannerContext);
  
    if (!context) throw new Error('useCacheScanner must be used within a CacheScannerProvider');
    
    return context;
};