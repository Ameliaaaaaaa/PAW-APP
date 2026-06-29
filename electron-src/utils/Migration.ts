import { EventEmitter } from 'events';
import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

import Database from './Database';

const OLD_PATH = '%AppData%\\me.amelia.PAW';

class Migration extends EventEmitter {
    private static instance: Migration;

    private oldPath: string | undefined;

    private migrating: boolean = false;

    private constructor() {
        super();
    };

    public static getInstance(): Migration {
        if (!Migration.instance) Migration.instance = new Migration();

        return Migration.instance;
    };

    public isMigrating(): boolean {
        return this.migrating;
    };

    private parsePathEnv(rawPath: string): string {
        const resolved: string = rawPath.replace(/(?:\$|%)(\w+)%?/g, (_: any, envVar: string): string => {
            const value: string | undefined = process.env[envVar];

            if (value === undefined) throw new Error(`Environment variable not found: ${envVar}`);

            return value;
        });

        const normalised: string = path.normalize(resolved);

        return fs.realpathSync(normalised);
    };

    private getOldPath(): string | undefined {
        if (!this.oldPath) this.oldPath = this.parsePathEnv(OLD_PATH);

        return <string>this.oldPath;
    };

    public handleMigration(): void {
        try {
            this.getOldPath();

            const oldDbPath = `${this.getOldPath()}/PAW.db`;

            if (!fs.existsSync(oldDbPath)) return;

            this.migrating = true;

            this.emit('status', {
                migrating: true,
                stage: 'starting'
            });

            const oldDb = new sqlite3.Database(oldDbPath, sqlite3.OPEN_READONLY, async (error: Error | null): Promise<void> => {
                if (error) {
                    console.log(error);

                    this.migrating = false;

                    this.emit('status', {
                        migrating: false,
                        stage: 'error',
                        error: error.message
                    });

                    return;
                }

                try {
                    this.emit('status', {
                        migrating: true,
                        stage: 'reading'
                    });

                    const categories: any[] = await new Promise((resolve: any, reject: any): void => {
                        oldDb.all('SELECT * FROM categories;', [], (err: Error | null, rows: unknown[]): any => err ? reject(err) : resolve(rows));
                    });

                    const favorites: any[] = await new Promise((resolve: any, reject: any): void => {
                        oldDb.all('SELECT * FROM favorites;', [], (err: Error | null, rows: unknown[]): any => err ? reject(err) : resolve(rows));
                    });

                    const categoryIdMap: Map<number, number> = new Map();

                    this.emit('status', {
                        migrating: true,
                        stage: 'categories',
                        total: categories.length,
                        completed: 0
                    });

                    for (let i: number = 0; i < categories.length; i++) {
                        const category: any = categories[i];

                        await Database.createCategory(category.name);

                        const newCategories: any[] = await Database.getCategories();
                        const newCategory: any = newCategories.find((c: any): boolean => c.name === category.name);

                        if (newCategory) categoryIdMap.set(category.id, newCategory.id);

                        this.emit('status', {
                            migrating: true,
                            stage: 'categories',
                            total: categories.length,
                            completed: i + 1
                        });
                    }

                    this.emit('status', {
                        migrating: true,
                        stage: 'favorites',
                        total: favorites.length,
                        completed: 0
                    });

                    for (let i: number = 0; i < favorites.length; i++) {
                        const favorite: any = favorites[i];
                        const newCategoryId: number | undefined = categoryIdMap.get(favorite.category_id);

                        if (newCategoryId !== undefined) await Database.favoriteAvatar(newCategoryId, favorite.avatar_id);

                        this.emit('status', {
                            migrating: true,
                            stage: 'favorites',
                            total: favorites.length,
                            completed: i + 1
                        });
                    }

                    fs.renameSync(oldDbPath, `${oldDbPath}.migrated`);

                    this.migrating = false;

                    this.emit('status', {
                        migrating: false,
                        stage: 'done'
                    });
                } catch (migrationError) {
                    console.log(migrationError);

                    this.migrating = false;

                    this.emit('status', {
                        migrating: false,
                        stage: 'error',
                        error: (migrationError as Error).message
                    });
                } finally {
                    oldDb.close((closeError: Error | null): void => {
                        if (closeError) {
                            console.log(closeError);
                            return;
                        }

                        try {
                            if (fs.existsSync(oldDbPath)) fs.renameSync(oldDbPath, `${oldDbPath}.migrated`);
                        } catch (renameError) {
                            console.log(renameError);
                        }
                    });
                }
            });
        } catch (error) {
            this.migrating = false;
        }
    };
}

export default Migration.getInstance();