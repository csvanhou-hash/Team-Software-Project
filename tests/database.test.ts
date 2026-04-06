import { describe, expect, it } from "vitest";

import {
    createLaundrySession,
    createUser,
    deleteLaundrySessionByUserId,
    getLaundryRecordsByUserId,
    getLaundrySessionByUserId,
    getUserByDiscordId,
    insertLaundry,
    updateLaundrySession,
    updateUser,
} from "../src/db/database.js";

describe("database helpers", () => {
    it("createUser inserts correctly and getUserByDiscordId returns the user", () => {
        const user = createUser("discord-1", "Case");

        const fetchedUser = getUserByDiscordId("discord-1");

        expect(user.discord_id).toBe("discord-1");
        expect(fetchedUser?.id).toBe(user.id);
        expect(fetchedUser?.discord_name).toBe("Case");
    });

    it("updateUser persists changes", () => {
        const user = createUser("discord-2", "Case");

        updateUser(user.id, {
            washerTimeSeconds: 1200,
            dryerTimeSeconds: 2400,
            lastBoughtDetergentAt: "2026-01-01T00:00:00.000Z",
        });

        const updatedUser = getUserByDiscordId("discord-2");

        expect(updatedUser?.washer_time_seconds).toBe(1200);
        expect(updatedUser?.dryer_time_seconds).toBe(2400);
        expect(updatedUser?.last_bought_detergent_at).toBe("2026-01-01T00:00:00.000Z");
    });

    it("insertLaundry inserts correctly", () => {
        const user = createUser("discord-3", "Case");

        const laundry = insertLaundry({
            userId: user.id,
            dateDone: "2026-02-01T12:00:00.000Z",
            loads: 3,
        });

        const records = getLaundryRecordsByUserId(user.id);

        expect(laundry.loads).toBe(3);
        expect(records).toHaveLength(1);
        expect(records[0]?.date_done).toBe("2026-02-01T12:00:00.000Z");
    });

    it("session helpers create update and delete correctly", () => {
        const user = createUser("discord-4", "Case");

        const session = createLaundrySession({
            userId: user.id,
            totalLoads: 2,
            washerTimeSeconds: 100,
            dryerTimeSeconds: 200,
            loadsStartedInWasher: 1,
            loadsMovedToDryer: 0,
            dryerLoadsCompleted: 0,
            washerRunning: 1,
            dryerRunning: 0,
            washerEndsAt: "2026-02-01T12:00:00.000Z",
            dryerEndsAt: null,
            awaitingMove: 0,
            awaitingFinish: 0,
        });

        const updatedSession = updateLaundrySession(session.id, {
            awaitingMove: 1,
            washerRunning: 0,
            washerEndsAt: null,
        });

        expect(updatedSession.awaiting_move).toBe(1);
        expect(updatedSession.washer_running).toBe(0);
        expect(getLaundrySessionByUserId(user.id)?.id).toBe(session.id);

        deleteLaundrySessionByUserId(user.id);

        expect(getLaundrySessionByUserId(user.id)).toBeUndefined();
    });
});
