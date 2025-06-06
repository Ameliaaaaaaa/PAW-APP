'use client';

import { watchImmediate, BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';
import { createContext, useContext, useEffect, useState, useReducer } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { error } from '@tauri-apps/plugin-log';

const BASE_URL = 'https://paw-api.amelia.fun';
const MAX_CONCURRENT_REQUESTS = 3;

const CacheScannerContext = createContext(null);

const cacheReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_PENDING_IDS': {
            const dedupedNewIds = [...new Set(action.ids)];
            const uniqueNewIds = dedupedNewIds.filter(id => !state.processedIds.includes(id) && !state.pendingIds.includes(id) && !state.processingIds.includes(id));
            
            return {
                ...state,
                pendingIds: [...state.pendingIds, ...uniqueNewIds]
            };
        }

        case 'START_PROCESSING': {
            return {
                ...state,
                activeRequests: state.activeRequests + 1,
                processingIds: [...state.processingIds, action.id]
            };
        }

        case 'FINISH_PROCESSING': {
            return {
                ...state,
                activeRequests: state.activeRequests - 1,
                processingIds: state.processingIds.filter(id => id !== action.id),
                processedIds: state.processedIds.includes(action.id) ? state.processedIds : [...state.processedIds, action.id], pendingIds: state.pendingIds.filter(id => id !== action.id)
            };
        }

        default:
            return state;
    }
};

export function CacheScannerProvider({ children }) {
    const [enabled, setEnabled] = useState(true);

    const [state, dispatch] = useReducer(cacheReducer, {
        pendingIds: [],
        processedIds: [],
        processingIds: [],
        activeRequests: 0
    });

    const [currentVersion, setCurrentVersion] = useState('0.0.0');

    const processId = async (id) => {
        if (!id || state.processingIds.includes(id)) return;
    
        dispatch({ type: 'START_PROCESSING', id });
    
        try {
            await sendToApi(id);
        } catch (e) {
            error(e);
        } finally {
            dispatch({ type: 'FINISH_PROCESSING', id });
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

        dispatch({ type: 'ADD_PENDING_IDS', ids: newIds });
    };

    useEffect(() => {
        const processNextBatch = async () => {
            if (state.activeRequests >= MAX_CONCURRENT_REQUESTS || state.pendingIds.length === 0) return;
    
            const availableSlots = MAX_CONCURRENT_REQUESTS - state.activeRequests;
            const idsToProcess = state.pendingIds.slice(0, availableSlots);
    
            idsToProcess.forEach(id => {
                processId(id);
            });
        };
    
        processNextBatch();
    }, [state.pendingIds, state.activeRequests, state.processingIds]);

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
            addToPendingIds,
            pendingCount: state.pendingIds.length,
            processingCount: state.processingIds.length,
            processedCount: state.processedIds.length,
            processedIds: state.processedIds
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