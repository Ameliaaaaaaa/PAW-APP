import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

class Database {
    private static instance: Database;

    private database: sqlite3.Database;
    private cache: sqlite3.Database;

    private constructor() {
        const pawDir: string = path.join(os.homedir(), 'Documents', 'PAW');

        if (!fs.existsSync(pawDir)) fs.mkdirSync(pawDir, {
            recursive: true
        });

        this.database = new sqlite3.Database(path.join(pawDir, 'PAW.db'), (error: Error | null): void => {
            if (error) console.log(error);
        });

        this.cache = new sqlite3.Database(path.join(pawDir, 'cache.db'), (error: Error | null): void => {
            if (error) console.log(error);
        });
    };

    public static getInstance(): Database {
        if (!Database.instance) Database.instance = new Database();

        return Database.instance;
    };

    public async initialize(): Promise<void> {
        await this.run('PRAGMA foreign_keys = ON;');

        await this.run(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await this.run(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                avatar_id TEXT NOT NULL,
                category_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
            );
        `);

        await this.cacheRun(`
            CREATE TABLE IF NOT EXISTS seen (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                avatar_id TEXT NOT NULL UNIQUE,
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.run(`CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name);`);
        await this.run(`CREATE INDEX IF NOT EXISTS idx_favorites_avatar_id ON favorites (avatar_id);`);
        await this.run(`CREATE INDEX IF NOT EXISTS idx_favorites_category_id ON favorites (category_id);`);

        await this.cacheRun(`CREATE INDEX IF NOT EXISTS idx_seen_avatar_id ON seen (avatar_id);`);

        await this.purgeOldSeen();
    };

    private run(sql: string, params: any[] = []): Promise<void> {
        return new Promise((resolve: any, reject: any): void => {
            this.database.run(sql, params, (error: Error | null): void => {
                if (error) return reject(error);

                resolve();
            });
        });
    };

    private all<T>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve: any, reject: any): void => {
            this.database.all(sql, params, (error: Error | null, rows: T[]): void => {
                if (error) return reject(error);

                resolve(rows);
            });
        });
    }

    private get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
        return new Promise((resolve: any, reject: any): void => {
            this.database.get(sql, params, (error: Error | null, row: T): void => {
                if (error) return reject(error);

                resolve(row);
            });
        });
    }

    public async createCategory(name: string): Promise<void> {
        await this.run('INSERT INTO categories (name) VALUES (?);', [name]);
    };

    public async getCategories(): Promise<any[]> {
        return this.all('SELECT * FROM categories ORDER BY name;');
    };

    public async updateCategory(categoryId: number, newName: string): Promise<void> {
        await this.run('UPDATE categories SET name = ? WHERE id = ?;', [newName, categoryId]);
    };

    public async deleteCategory(categoryId: number): Promise<void> {
        await this.run('DELETE FROM categories WHERE id = ?;', [categoryId]);
    };

    public async getFavorites(categoryId: number): Promise<any[]> {
        return this.all('SELECT * FROM favorites WHERE category_id = ? ORDER BY created_at DESC;', [categoryId]);
    };

    public async checkFavorite(avatarId: string): Promise<any> {
        return this.all('SELECT * FROM favorites WHERE avatar_id = ?;', [avatarId]);
    };

    public async favoriteAvatar(categoryId: number, avatarId: string): Promise<{ success: boolean; exists?: boolean; error?: string }> {
        const existingFavorite = await this.get('SELECT * FROM favorites WHERE avatar_id = ? AND category_id = ?;', [avatarId, categoryId]);

        if (existingFavorite) return {
            success: false,
            exists: true
        };

        await this.run('INSERT INTO favorites (avatar_id, category_id) VALUES (?, ?);', [avatarId, categoryId]);

        return {
            success: true,
            exists: false
        };
    };

    public async unfavoriteAvatar(favoriteId: number): Promise<void> {
        await this.run('DELETE FROM favorites WHERE id = ?;', [favoriteId]);
    };

    public async removeFromFavorites(avatarId: string): Promise<void> {
        await this.run('DELETE FROM favorites WHERE avatar_id = ?;', [avatarId]);
    };

    private cacheRun(sql: string, params: any[] = []): Promise<void> {
        return new Promise((resolve: any, reject: any): void => {
            this.cache.run(sql, params, (error: Error | null): any => {
                if (error) return reject(error);

                resolve();
            });
        });
    };

    private cacheAll<T>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve: any, reject: any): void => {
            this.cache.all(sql, params, (error: Error | null, rows: T[]): any => {
                if (error) return reject(error);

                resolve(rows);
            });
        });
    };

    private async purgeOldSeen(): Promise<void> {
        await this.cacheRun(`DELETE FROM seen WHERE first_seen < datetime('now', '-3 days');`);
    };

    public async hasSeen(avatarId: string): Promise<boolean> {
        const rows: unknown[] = await this.cacheAll('SELECT 1 FROM seen WHERE avatar_id = ? LIMIT 1;', [avatarId]);

        return rows.length > 0;
    };

    public async markSeen(avatarId: string): Promise<void> {
        await this.cacheRun(`INSERT INTO seen (avatar_id) VALUES (?) ON CONFLICT (avatar_id) DO UPDATE SET last_seen = CURRENT_TIMESTAMP;`, [avatarId]);
    };

    public async getSeenAvatars(orderBy: 'last_seen' | 'first_seen' = 'last_seen'): Promise<{ avatar_id: string; first_seen: string; last_seen: string }[]> {
        return this.cacheAll(`SELECT avatar_id, first_seen, last_seen FROM seen ORDER BY ${orderBy} DESC;`);
    };
}

export default Database.getInstance();