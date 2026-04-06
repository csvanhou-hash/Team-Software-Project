import { beforeEach, describe, expect, it, vi } from "vitest";

import { finishLaundryCommand } from "../src/commands/finishLaundry.js";
import { moveLaundryCommand } from "../src/commands/moveLaundry.js";
import {
    createLaundrySession,
    createUser,
    getLaundryRecordsByUserId,
    getLaundrySessionByUserId,
    getUserByDiscordId,
} from "../src/db/database.js";
import {
    finishLaundrySession,
    moveLaundrySession,
    startLaundrySession,
} from "../src/services/laundrySessionService.js";
import * as timerService from "../src/services/timerService.js";
import { createMockInteraction } from "./helpers.js";

describe("laundry session workflow logic", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
    });

    it("moveLaundry fails if there is no active session", () => {
        const result = moveLaundrySession(999);

        expect(result.ok).toBe(false);
        expect(result.message).toBe("You do not have an active laundry session.");
    });

    it("moveLaundry fails if session is not awaiting move", () => {
        const user = createUser("discord-session-1", "Case");
        startLaundrySession({
            userId: user.id,
            totalLoads: 2,
            washerTimeSeconds: 100,
            dryerTimeSeconds: 200,
        });

        const result = moveLaundrySession(user.id);

        expect(result.ok).toBe(false);
        expect(result.message).toBe("Nothing needs to be moved right now. I’ll DM you when it is time.");
    });

    it("moveLaundry correctly advances a washer finished session into dryer", () => {
        const user = createUser("discord-session-2", "Case");
        const session = createLaundrySession({
            userId: user.id,
            totalLoads: 2,
            washerTimeSeconds: 100,
            dryerTimeSeconds: 200,
            loadsStartedInWasher: 1,
            loadsMovedToDryer: 0,
            dryerLoadsCompleted: 0,
            washerRunning: 0,
            dryerRunning: 0,
            washerEndsAt: null,
            dryerEndsAt: null,
            awaitingMove: 1,
            awaitingFinish: 0,
        });

        const result = moveLaundrySession(user.id);

        expect(result.ok).toBe(true);
        expect(result.session).toMatchObject({
            id: session.id,
            loads_moved_to_dryer: 1,
            dryer_running: 1,
            awaiting_move: 0,
        });
    });

    it("moveLaundry starts the next washer load when more loads remain", () => {
        const user = createUser("discord-session-3", "Case");
        createLaundrySession({
            userId: user.id,
            totalLoads: 3,
            washerTimeSeconds: 100,
            dryerTimeSeconds: 200,
            loadsStartedInWasher: 1,
            loadsMovedToDryer: 0,
            dryerLoadsCompleted: 0,
            washerRunning: 0,
            dryerRunning: 0,
            washerEndsAt: null,
            dryerEndsAt: null,
            awaitingMove: 1,
            awaitingFinish: 0,
        });

        const result = moveLaundrySession(user.id);

        expect(result.ok).toBe(true);
        expect(result.session.loads_started_in_washer).toBe(2);
        expect(result.session.washer_running).toBe(1);
        expect(result.message).toBe(
            "Laundry moved. Dryer has started and the next washer load is running."
        );
    });

    it("moveLaundry handles the final washer load correctly", () => {
        const user = createUser("discord-session-4", "Case");
        createLaundrySession({
            userId: user.id,
            totalLoads: 2,
            washerTimeSeconds: 100,
            dryerTimeSeconds: 200,
            loadsStartedInWasher: 2,
            loadsMovedToDryer: 1,
            dryerLoadsCompleted: 1,
            washerRunning: 0,
            dryerRunning: 0,
            washerEndsAt: null,
            dryerEndsAt: null,
            awaitingMove: 1,
            awaitingFinish: 0,
        });

        const result = moveLaundrySession(user.id);

        expect(result.ok).toBe(true);
        expect(result.session.washer_running).toBe(0);
        expect(result.session.loads_moved_to_dryer).toBe(2);
        expect(result.session.awaiting_move).toBe(0);
        expect(result.message).toBe("Laundry moved. Dryer has started for the final load.");
    });

    it("moveLaundry command response includes visible dryer and washer timers when both are running", async () => {
        const user = createUser("discord-session-4b", "Case");
        const interaction = createMockInteraction();
        vi.spyOn(timerService, "syncLaundrySessionTimers").mockImplementation(() => {});

        createLaundrySession({
            userId: user.id,
            totalLoads: 3,
            washerTimeSeconds: 100,
            dryerTimeSeconds: 200,
            loadsStartedInWasher: 1,
            loadsMovedToDryer: 0,
            dryerLoadsCompleted: 0,
            washerRunning: 0,
            dryerRunning: 0,
            washerEndsAt: null,
            dryerEndsAt: null,
            awaitingMove: 1,
            awaitingFinish: 0,
        });

        await moveLaundryCommand.execute(interaction as never, user);

        expect(interaction.reply).toHaveBeenCalledWith(
            "Laundry moved. Dryer has started and the next washer load is running. Washer: 1m 40s remaining. Dryer: 3m 20s remaining."
        );
    });

    it("finishLaundry fails if there is no active session", () => {
        const result = finishLaundrySession(999);

        expect(result.ok).toBe(false);
        expect(result.message).toBe("You do not have an active laundry session.");
    });

    it("finishLaundry fails if the session is not awaiting finish", () => {
        const user = createUser("discord-session-5", "Case");
        startLaundrySession({
            userId: user.id,
            totalLoads: 1,
            washerTimeSeconds: 100,
            dryerTimeSeconds: 200,
        });

        const result = finishLaundrySession(user.id);

        expect(result.ok).toBe(false);
        expect(result.message).toBe(
            "Laundry is not ready to finish yet. I’ll DM you when the final dryer cycle is done."
        );
    });

    it("finishLaundry inserts a completed record updates last_laundry_at and clears the session", () => {
        const user = createUser("discord-session-6", "Case");
        const session = createLaundrySession({
            userId: user.id,
            totalLoads: 3,
            washerTimeSeconds: 100,
            dryerTimeSeconds: 200,
            loadsStartedInWasher: 3,
            loadsMovedToDryer: 3,
            dryerLoadsCompleted: 2,
            washerRunning: 0,
            dryerRunning: 0,
            washerEndsAt: null,
            dryerEndsAt: null,
            awaitingMove: 0,
            awaitingFinish: 1,
        });

        const result = finishLaundrySession(user.id);

        expect(result.ok).toBe(true);
        expect(getLaundryRecordsByUserId(user.id)).toHaveLength(1);
        expect(getLaundryRecordsByUserId(user.id)[0]?.loads).toBe(3);
        expect(getUserByDiscordId("discord-session-6")?.last_laundry_at).not.toBeNull();
        expect(getLaundrySessionByUserId(user.id)).toBeUndefined();
        expect(session.id).toBeGreaterThan(0);
    });

    it("finishLaundry command cancels timers after success", async () => {
        const user = createUser("discord-session-7", "Case");
        const interaction = createMockInteraction();
        createLaundrySession({
            userId: user.id,
            totalLoads: 1,
            washerTimeSeconds: 100,
            dryerTimeSeconds: 200,
            loadsStartedInWasher: 1,
            loadsMovedToDryer: 1,
            dryerLoadsCompleted: 0,
            washerRunning: 0,
            dryerRunning: 0,
            washerEndsAt: null,
            dryerEndsAt: null,
            awaitingMove: 0,
            awaitingFinish: 1,
        });
        const clearTimersSpy = vi.spyOn(timerService, "clearLaundrySessionTimers");

        await finishLaundryCommand.execute(interaction as never, user);

        expect(clearTimersSpy).toHaveBeenCalledWith(user.id);
    });
});
