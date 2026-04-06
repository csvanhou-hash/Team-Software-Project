import Database from "better-sqlite3";
import path from "node:path";

const databasePath = process.env.LAUNDRY_BOT_DB_PATH
    ? path.resolve(process.env.LAUNDRY_BOT_DB_PATH)
    : path.resolve(process.cwd(), "laundry-bot.sqlite");
const db = new Database(databasePath);

db.pragma("foreign_keys = ON");

export type User = {
    id: number;
    discord_id: string;
    discord_name: string;
    washer_time_seconds: number | null;
    dryer_time_seconds: number | null;
    last_laundry_at: string | null;
    last_bought_detergent_at: string | null;
    created_at: string;
};

export type Laundry = {
    id: number;
    user_id: number;
    date_done: string;
    loads: number;
};

export type LaundrySession = {
    id: number;
    user_id: number;
    total_loads: number;
    washer_time_seconds: number;
    dryer_time_seconds: number;
    loads_started_in_washer: number;
    loads_moved_to_dryer: number;
    dryer_loads_completed: number;
    washer_running: number;
    dryer_running: number;
    washer_ends_at: string | null;
    dryer_ends_at: string | null;
    awaiting_move: number;
    awaiting_finish: number;
    created_at: string;
};

export type UpdateUserInput = {
    discordName?: string;
    washerTimeSeconds?: number | null;
    dryerTimeSeconds?: number | null;
    lastLaundryAt?: string | null;
    lastBoughtDetergentAt?: string | null;
};

export type InsertLaundryInput = {
    userId: number;
    dateDone: string;
    loads: number;
};

export type CreateLaundrySessionInput = {
    userId: number;
    totalLoads: number;
    washerTimeSeconds: number;
    dryerTimeSeconds: number;
    loadsStartedInWasher: number;
    loadsMovedToDryer: number;
    dryerLoadsCompleted: number;
    washerRunning: number;
    dryerRunning: number;
    washerEndsAt: string | null;
    dryerEndsAt: string | null;
    awaitingMove: number;
    awaitingFinish: number;
};

export type UpdateLaundrySessionInput = {
    totalLoads?: number;
    washerTimeSeconds?: number;
    dryerTimeSeconds?: number;
    loadsStartedInWasher?: number;
    loadsMovedToDryer?: number;
    dryerLoadsCompleted?: number;
    washerRunning?: number;
    dryerRunning?: number;
    washerEndsAt?: string | null;
    dryerEndsAt?: string | null;
    awaitingMove?: number;
    awaitingFinish?: number;
};

export type LaundryStatistics = {
    totalRecords: number;
    totalLoads: number;
    mostRecentLaundryDate: string | null;
};

export function getDatabasePath() {
    return databasePath;
}

export function initializeDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discord_id TEXT UNIQUE,
            discord_name TEXT,
            washer_time_seconds INTEGER NULL,
            dryer_time_seconds INTEGER NULL,
            last_laundry_at DATETIME NULL,
            last_bought_detergent_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS laundries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date_done DATETIME NOT NULL,
            loads INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS laundry_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            total_loads INTEGER NOT NULL,
            washer_time_seconds INTEGER NOT NULL,
            dryer_time_seconds INTEGER NOT NULL,
            loads_started_in_washer INTEGER NOT NULL,
            loads_moved_to_dryer INTEGER NOT NULL,
            dryer_loads_completed INTEGER NOT NULL,
            washer_running INTEGER NOT NULL DEFAULT 0,
            dryer_running INTEGER NOT NULL DEFAULT 0,
            washer_ends_at DATETIME NULL,
            dryer_ends_at DATETIME NULL,
            awaiting_move INTEGER NOT NULL DEFAULT 0,
            awaiting_finish INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);
}

export function getUserByDiscordId(discordId: string): User | undefined {
    return db
        .prepare("SELECT * FROM users WHERE discord_id = ?")
        .get(discordId) as User | undefined;
}

export function getUserById(userId: number): User | undefined {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | undefined;
}

export function getAllUsers(): User[] {
    return db.prepare("SELECT * FROM users ORDER BY id ASC").all() as User[];
}

export function getLaundryRecordsByUserId(userId: number): Laundry[] {
    return db
        .prepare("SELECT * FROM laundries WHERE user_id = ? ORDER BY id ASC")
        .all(userId) as Laundry[];
}

export function createUser(discordId: string, discordName: string): User {
    const result = db
        .prepare(
            `
            INSERT INTO users (discord_id, discord_name)
            VALUES (?, ?)
            `
        )
        .run(discordId, discordName);

    return db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(result.lastInsertRowid) as User;
}

export function updateUser(userId: number, updates: UpdateUserInput): User {
    const fields: string[] = [];
    const values: Array<string | number | null> = [];

    if (updates.discordName !== undefined) {
        fields.push("discord_name = ?");
        values.push(updates.discordName);
    }

    if (updates.washerTimeSeconds !== undefined) {
        fields.push("washer_time_seconds = ?");
        values.push(updates.washerTimeSeconds);
    }

    if (updates.dryerTimeSeconds !== undefined) {
        fields.push("dryer_time_seconds = ?");
        values.push(updates.dryerTimeSeconds);
    }

    if (updates.lastLaundryAt !== undefined) {
        fields.push("last_laundry_at = ?");
        values.push(updates.lastLaundryAt);
    }

    if (updates.lastBoughtDetergentAt !== undefined) {
        fields.push("last_bought_detergent_at = ?");
        values.push(updates.lastBoughtDetergentAt);
    }

    if (fields.length === 0) {
        return db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User;
    }

    values.push(userId);

    db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    return db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User;
}

export function insertLaundry(input: InsertLaundryInput): Laundry {
    const result = db
        .prepare(
            `
            INSERT INTO laundries (user_id, date_done, loads)
            VALUES (?, ?, ?)
            `
        )
        .run(input.userId, input.dateDone, input.loads);

    return db
        .prepare("SELECT * FROM laundries WHERE id = ?")
        .get(result.lastInsertRowid) as Laundry;
}

export function getLaundryStatisticsByUserId(userId: number): LaundryStatistics {
    return db
        .prepare(
            `
            SELECT
                COUNT(*) AS totalRecords,
                COALESCE(SUM(loads), 0) AS totalLoads,
                MAX(date_done) AS mostRecentLaundryDate
            FROM laundries
            WHERE user_id = ?
            `
        )
        .get(userId) as LaundryStatistics;
}

export function getLaundrySessionByUserId(userId: number): LaundrySession | undefined {
    return db
        .prepare("SELECT * FROM laundry_sessions WHERE user_id = ?")
        .get(userId) as LaundrySession | undefined;
}

export function getAllLaundrySessions(): LaundrySession[] {
    return db
        .prepare("SELECT * FROM laundry_sessions ORDER BY id ASC")
        .all() as LaundrySession[];
}

export function createLaundrySession(input: CreateLaundrySessionInput): LaundrySession {
    const result = db
        .prepare(
            `
            INSERT INTO laundry_sessions (
                user_id,
                total_loads,
                washer_time_seconds,
                dryer_time_seconds,
                loads_started_in_washer,
                loads_moved_to_dryer,
                dryer_loads_completed,
                washer_running,
                dryer_running,
                washer_ends_at,
                dryer_ends_at,
                awaiting_move,
                awaiting_finish
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
        )
        .run(
            input.userId,
            input.totalLoads,
            input.washerTimeSeconds,
            input.dryerTimeSeconds,
            input.loadsStartedInWasher,
            input.loadsMovedToDryer,
            input.dryerLoadsCompleted,
            input.washerRunning,
            input.dryerRunning,
            input.washerEndsAt,
            input.dryerEndsAt,
            input.awaitingMove,
            input.awaitingFinish
        );

    return db
        .prepare("SELECT * FROM laundry_sessions WHERE id = ?")
        .get(result.lastInsertRowid) as LaundrySession;
}

export function updateLaundrySession(
    sessionId: number,
    updates: UpdateLaundrySessionInput
): LaundrySession {
    const fields: string[] = [];
    const values: Array<string | number | null> = [];

    if (updates.totalLoads !== undefined) {
        fields.push("total_loads = ?");
        values.push(updates.totalLoads);
    }

    if (updates.washerTimeSeconds !== undefined) {
        fields.push("washer_time_seconds = ?");
        values.push(updates.washerTimeSeconds);
    }

    if (updates.dryerTimeSeconds !== undefined) {
        fields.push("dryer_time_seconds = ?");
        values.push(updates.dryerTimeSeconds);
    }

    if (updates.loadsStartedInWasher !== undefined) {
        fields.push("loads_started_in_washer = ?");
        values.push(updates.loadsStartedInWasher);
    }

    if (updates.loadsMovedToDryer !== undefined) {
        fields.push("loads_moved_to_dryer = ?");
        values.push(updates.loadsMovedToDryer);
    }

    if (updates.dryerLoadsCompleted !== undefined) {
        fields.push("dryer_loads_completed = ?");
        values.push(updates.dryerLoadsCompleted);
    }

    if (updates.washerRunning !== undefined) {
        fields.push("washer_running = ?");
        values.push(updates.washerRunning);
    }

    if (updates.dryerRunning !== undefined) {
        fields.push("dryer_running = ?");
        values.push(updates.dryerRunning);
    }

    if (updates.washerEndsAt !== undefined) {
        fields.push("washer_ends_at = ?");
        values.push(updates.washerEndsAt);
    }

    if (updates.dryerEndsAt !== undefined) {
        fields.push("dryer_ends_at = ?");
        values.push(updates.dryerEndsAt);
    }

    if (updates.awaitingMove !== undefined) {
        fields.push("awaiting_move = ?");
        values.push(updates.awaitingMove);
    }

    if (updates.awaitingFinish !== undefined) {
        fields.push("awaiting_finish = ?");
        values.push(updates.awaitingFinish);
    }

    if (fields.length === 0) {
        return db.prepare("SELECT * FROM laundry_sessions WHERE id = ?").get(sessionId) as LaundrySession;
    }

    values.push(sessionId);

    db.prepare(`UPDATE laundry_sessions SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    return db
        .prepare("SELECT * FROM laundry_sessions WHERE id = ?")
        .get(sessionId) as LaundrySession;
}

export function deleteLaundrySessionByUserId(userId: number) {
    db.prepare("DELETE FROM laundry_sessions WHERE user_id = ?").run(userId);
}

export function resetDatabase() {
    db.exec(`
        DELETE FROM laundry_sessions;
        DELETE FROM laundries;
        DELETE FROM users;
        DELETE FROM sqlite_sequence WHERE name IN ('users', 'laundries', 'laundry_sessions');
    `);
}
