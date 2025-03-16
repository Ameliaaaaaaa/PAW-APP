'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { error as err } from '@tauri-apps/plugin-log';
import Database from '@tauri-apps/plugin-sql';

const DatabaseContext = createContext(null);

export function DatabaseProvider({ children }) {
    const [database, setDatabase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        /* const openDatabase = async () => {
            try {
                const database = await Database.load('sqlite:PAW.db');

                setDatabase(database);
                setLoading(false);
            } catch (e) {
                err('Failed to open database:', e);
                setError(e);
                setLoading(false);
            }
        };

        openDatabase(); */
    });

    const getDatabase = () => {
        return database;
    };

    return (
        <DatabaseContext.Provider
        value={{
            getDatabase: getDatabase
        }}
        >
            {children}
        </DatabaseContext.Provider>
    );
};

export function useDatabase() {
    const context = useContext(DatabaseContext);
  
    if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
    
    return context;
};