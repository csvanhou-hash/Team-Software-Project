import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    createLaundrySession,
    createUser,
    getLaundrySessionByUserId,
} from "../src/db/database.js";
import {
    clearLaundrySessionTimers,
    syncLaundrySessionTimers,
} from "../src/services/timerService.js";

describe("timer service", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
    });

    it("starting a washer timer schedules completion behavior", async () => {
        const user = createUser("discord-timer-1", "Case");
        const send = vi.fn().mockResolvedValue(undefined);
        const fetch = vi.fn().mockResolvedValue({ send });
        const client = { users: { fetch } };
        const session = createLaundrySession({
            userId: user.id,
            totalLoads: 1,
            washerTimeSeconds: 10,
            dryerTimeSeconds: 20,
            loadsStartedInWasher: 1,
            loadsMovedToDryer: 0,
            dryerLoadsCompleted: 0,
            washerRunning: 1,
            dryerRunning: 0,
            washerEndsAt: "2026-04-06T12:00:10.000Z",
            dryerEndsAt: null,
            awaitingMove: 0,
            awaitingFinish: 0,
        });

        syncLaundrySessionTimers(client as never, session);
        await vi.advanceTimersByTimeAsync(10_000);

        const updatedSession = getLaundrySessionByUserId(user.id);

        expect(updatedSession?.washer_running).toBe(0);
        expect(updatedSession?.awaiting_move).toBe(1);
        expect(fetch).toHaveBeenCalledWith("discord-timer-1");
        expect(send).toHaveBeenCalledWith(
            "It is time to move your laundry. Run /movelaundry to continue."
        );
    });

    it("starting a dryer timer schedules completion behavior and final dryer completion marks awaiting finish", async () => {
        const user = createUser("discord-timer-2", "Case");
        const send = vi.fn().mockResolvedValue(undefined);
        const fetch = vi.fn().mockResolvedValue({ send });
        const client = { users: { fetch } };
        const session = createLaundrySession({
            userId: user.id,
            totalLoads: 1,
            washerTimeSeconds: 10,
            dryerTimeSeconds: 20,
            loadsStartedInWasher: 1,
            loadsMovedToDryer: 1,
            dryerLoadsCompleted: 0,
            washerRunning: 0,
            dryerRunning: 1,
            washerEndsAt: null,
            dryerEndsAt: "2026-04-06T12:00:20.000Z",
            awaitingMove: 0,
            awaitingFinish: 0,
        });

        syncLaundrySessionTimers(client as never, session);
        await vi.advanceTimersByTimeAsync(20_000);

        const updatedSession = getLaundrySessionByUserId(user.id);

        expect(updatedSession?.dryer_running).toBe(0);
        expect(updatedSession?.dryer_loads_completed).toBe(1);
        expect(updatedSession?.awaiting_finish).toBe(1);
        expect(send).toHaveBeenCalledWith(
            "Your laundry is done. Run /finishlaundry to record it."
        );
    });

    it("washer completion marks session as awaiting move when appropriate", async () => {
        const user = createUser("discord-timer-3", "Case");
        const client = {
            users: {
                fetch: vi.fn().mockResolvedValue({
                    send: vi.fn().mockResolvedValue(undefined),
                }),
            },
        };
        const session = createLaundrySession({
            userId: user.id,
            totalLoads: 2,
            washerTimeSeconds: 5,
            dryerTimeSeconds: 20,
            loadsStartedInWasher: 1,
            loadsMovedToDryer: 0,
            dryerLoadsCompleted: 0,
            washerRunning: 1,
            dryerRunning: 0,
            washerEndsAt: "2026-04-06T12:00:05.000Z",
            dryerEndsAt: null,
            awaitingMove: 0,
            awaitingFinish: 0,
        });

        syncLaundrySessionTimers(client as never, session);
        await vi.advanceTimersByTimeAsync(5_000);

        expect(getLaundrySessionByUserId(user.id)?.awaiting_move).toBe(1);
    });

    it("DM failures do not crash the logic", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const user = createUser("discord-timer-4", "Case");
        const client = {
            users: {
                fetch: vi.fn().mockRejectedValue(new Error("DM closed")),
            },
        };
        const session = createLaundrySession({
            userId: user.id,
            totalLoads: 1,
            washerTimeSeconds: 1,
            dryerTimeSeconds: 1,
            loadsStartedInWasher: 1,
            loadsMovedToDryer: 0,
            dryerLoadsCompleted: 0,
            washerRunning: 1,
            dryerRunning: 0,
            washerEndsAt: "2026-04-06T12:00:01.000Z",
            dryerEndsAt: null,
            awaitingMove: 0,
            awaitingFinish: 0,
        });

        syncLaundrySessionTimers(client as never, session);
        await vi.advanceTimersByTimeAsync(1_000);

        expect(getLaundrySessionByUserId(user.id)?.awaiting_move).toBe(1);
        expect(errorSpy).toHaveBeenCalled();

        clearLaundrySessionTimers(user.id);
    });
});
