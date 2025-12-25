'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Database from '@razein97/tauri-plugin-rusqlite2';
import { error } from '@tauri-apps/plugin-log';
import { toast } from 'sonner';

const DatabaseContext = createContext(null);

export function DatabaseProvider({ children }) {
    const [database, setDatabase] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const openDatabase = async () => {
            try {
                const database = await Database.load('sqlite:PAW.db');

                await database.execute(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
                await database.execute(`CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, avatar_id TEXT NOT NULL, avatar_data TEXT NOT NULL, category_id INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE)`);

                setDatabase(database);
                setLoading(false);
            } catch (e) {
                await error(e);
                toast.error('Failed to open database.');
            } finally {
                setLoading(false);
            }
        };

        openDatabase();
    }, []);

    const getDatabase = () => {
        return database;
    };

    const createCategory = async (name) => {
        await database.execute('INSERT INTO categories (name) VALUES (?);', [name]);
    };

    const getCategories = async () => {
        try {
            const database = await Database.load('sqlite:PAW.db');

            await database.execute(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            await database.execute(`CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, avatar_id TEXT NOT NULL, avatar_data TEXT NOT NULL, category_id INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE)`);

            setDatabase(database);
            setLoading(false);

            return await database.select('SELECT * FROM categories ORDER BY name;');
        } catch (e) {
            await error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateCategory = async (categoryId, newName) => {
        await database.execute('UPDATE categories SET name = ? WHERE id = ?;', [newName, categoryId]);
    };

    const deleteCategory = async (categoryId) => {
        await database.execute('DELETE FROM categories WHERE id = ?;', [categoryId]);
    };

    const getFavorites = async (categoryId) => {
        return await database.select('SELECT * FROM favorites WHERE category_id = ? ORDER BY created_at DESC;', [categoryId,]);
    };

    const checkFavorite = async (avatarId) => {
        return await database.select('SELECT * FROM favorites WHERE avatar_id = ?;', [avatarId]);
    };

    const favoriteAvatar = async (categoryId, avatarId, avatarData) => {
        const existingFavorite = await database.select('SELECT * FROM favorites WHERE avatar_id = ? AND category_id = ?;', [
            avatarId,
            categoryId
        ]);

        if (existingFavorite.length > 0) return {
            success: false,
            exists: true
        };

        await database.execute('INSERT INTO favorites (avatar_id, avatar_data, category_id) VALUES (?, ?, ?);', [
            avatarId,
            avatarData,
            categoryId
        ]);

        return {
            success: true,
            exists: false
        };
    };

    const unfavoriteAvatar = async (favoriteId) => {
        await database.execute('DELETE FROM favorites WHERE id = ?;', [favoriteId]);
    };

    const removeFromFavorites = async (avatarId) => {
        await database.execute('DELETE FROM favorites WHERE avatar_id = ?;', [avatarId]);
    };

    return (
        <DatabaseContext.Provider
        value={{
            getDatabase,
            createCategory,
            getCategories,
            updateCategory,
            deleteCategory,
            getFavorites,
            checkFavorite,
            favoriteAvatar,
            unfavoriteAvatar,
            removeFromFavorites
        }}
        >
            {children}
        </DatabaseContext.Provider>
    );
}

export function useDatabase() {
    const context = useContext(DatabaseContext);
  
    if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
    
    return context;
}